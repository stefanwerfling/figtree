import cluster, {Worker} from 'cluster';
import {Logger} from '../Logger/Logger.js';
import {SharedStore, SharedStoreSubscriber} from './SharedStore.js';

/**
 * IPC message envelope used by IPCSharedStore.
 */
type IPCMessage = {
    type: string;
    key?: string;
    value?: any;
    requestId?: string;
    channel?: string;
};

/**
 * IPC Shared store
 */
export class IPCSharedStore extends SharedStore {

    /**
     * Store
     * @private
     */
    private _store = new Map<string, any>();

    /**
     * Local pub/sub subscribers — channel name → set of callbacks for THIS process.
     * @private
     */
    private _subscribers = new Map<string, Set<SharedStoreSubscriber>>();

    /**
     * Init the shared store
     */
    public async init(): Promise<void> {
        if (cluster.isPrimary) {
            cluster.on('message', (worker, msg: IPCMessage) => {
                if (!msg || typeof msg !== 'object') {
                    return;
                }

                this._handlePrimaryMessage(worker, msg);
            });
        } else {
            process.on('message', (msg: IPCMessage) => {
                if (!msg || typeof msg !== 'object') {
                    return;
                }

                if (msg.type === 'pubsub' && typeof msg.channel === 'string') {
                    this._dispatchLocalSubscribers(msg.channel, msg.value);
                }
            });
        }
    }

    /**
     * Master-side message dispatch.
     * @param {Worker} worker
     * @param {IPCMessage} msg
     * @private
     */
    private _handlePrimaryMessage(worker: Worker, msg: IPCMessage): void {
        switch (msg.type) {
            case 'set':
                this._store.set(msg.key as string, msg.value);
                break;

            case 'delete':
                this._store.delete(msg.key as string);
                break;

            case 'clear':
                this._store.clear();
                break;

            case 'get':
                worker.send({
                    type: 'getResponse',
                    requestId: msg.requestId,
                    key: msg.key,
                    value: this._store.get(msg.key as string)
                });
                break;

            case 'has':
                worker.send({
                    type: 'hasResponse',
                    requestId: msg.requestId,
                    key: msg.key,
                    value: this._store.has(msg.key as string)
                });
                break;

            case 'publish':
                this._fanOutPublish(msg.channel as string, msg.value);
                break;

            default:
                break;
        }
    }

    private _sendAndWait<T>(type: string, key?: string, value?: any): Promise<T> {
        return new Promise((resolve) => {
            const requestId = Math.random().toString(36).substring(2);

            const handler = (msg: IPCMessage): void => {
                if (msg.requestId === requestId) {
                    process.off('message', handler);
                    resolve(msg.value as T);
                }
            };

            process.on('message', handler);
            process.send?.({ type: type, key: key, value: value, requestId: requestId });
        });
    }

    /**
     * Get value by key
     * @param {string} key
     * @return {T}
     * @template T
     */
    public async get<T = any>(key: string): Promise<T | undefined> {
        if (cluster.isPrimary) {
            return this._store.get(key);
        }

        return this._sendAndWait<T>('get', key);
    }

    /**
     * Set a value by key
     * @param {string} key
     * @param {T} value
     * @template T
     */
    public async set<T = any>(key: string, value: T): Promise<void> {
        if (cluster.isPrimary) {
            this._store.set(key, value);
        } else {
            process.send?.({ type: 'set', key: key, value: value });
        }
    }

    /**
     * delete value by key
     * @param {string} key
     */
    public async delete(key: string): Promise<void> {
        if (cluster.isPrimary) {
            this._store.delete(key);
        }
        else {
            process.send?.({ type: 'delete', key: key });
        }
    }

    /**
     * has a key in the store
     * @param {string} key
     * @return {boolean}
     */
    public async has(key: string): Promise<boolean> {
        if (cluster.isPrimary) {
            return this._store.has(key);
        }

        return this._sendAndWait<boolean>('has', key);
    }

    /**
     * Clear the shared store
     */
    public async clear(): Promise<void> {
        if (cluster.isPrimary) {
            this._store.clear();
        }
        else {
            process.send?.({ type: 'clear' });
        }
    }

    /**
     * Publish a message to all subscribers of the channel cluster-wide.
     * @param {string} channel
     * @param {T} message
     * @template T
     */
    public async publish<T = any>(channel: string, message: T): Promise<void> {
        if (cluster.isPrimary) {
            this._fanOutPublish(channel, message);
        } else {
            process.send?.({ type: 'publish', channel: channel, value: message });
        }
    }

    /**
     * Subscribe to a channel. Multiple subscribers per channel are supported.
     * @param {string} channel
     * @param {SharedStoreSubscriber<T>} callback
     * @template T
     */
    public async subscribe<T = any>(channel: string, callback: SharedStoreSubscriber<T>): Promise<void> {
        let set = this._subscribers.get(channel);

        if (!set) {
            set = new Set();
            this._subscribers.set(channel, set);
        }

        set.add(callback as SharedStoreSubscriber);
    }

    /**
     * Unsubscribe from a channel. If `callback` is omitted, removes all subscribers
     * for the channel in this process.
     * @param {string} channel
     * @param {SharedStoreSubscriber<T>} callback
     * @template T
     */
    public async unsubscribe<T = any>(channel: string, callback?: SharedStoreSubscriber<T>): Promise<void> {
        if (!callback) {
            this._subscribers.delete(channel);
            return;
        }

        const set = this._subscribers.get(channel);

        if (set) {
            set.delete(callback as SharedStoreSubscriber);

            if (set.size === 0) {
                this._subscribers.delete(channel);
            }
        }
    }

    /**
     * Master-side: broadcast a published message to every worker AND deliver to
     * the master's own local subscribers.
     * @param {string} channel
     * @param {any} message
     * @private
     */
    private _fanOutPublish(channel: string, message: any): void {
        for (const w of Object.values(cluster.workers ?? {})) {
            if (!w || w.isDead()) {
                continue;
            }

            try {
                w.send({ type: 'pubsub', channel: channel, value: message });
            } catch (err) {
                Logger.getLogger().warn?.('IPCSharedStore::publish: failed to deliver to worker', err);
            }
        }

        this._dispatchLocalSubscribers(channel, message);
    }

    /**
     * Dispatch a message to all local subscribers of the given channel.
     * Errors in individual callbacks are logged and do not affect siblings.
     * @param {string} channel
     * @param {any} message
     * @private
     */
    private _dispatchLocalSubscribers(channel: string, message: any): void {
        const set = this._subscribers.get(channel);

        if (!set || set.size === 0) {
            return;
        }

        for (const cb of set) {
            try {
                const ret = cb(message);

                if (ret instanceof Promise) {
                    ret.catch((err) => {
                        Logger.getLogger().error?.(`IPCSharedStore::subscriber error on '${channel}':`, err);
                    });
                }
            } catch (err) {
                Logger.getLogger().error?.(`IPCSharedStore::subscriber error on '${channel}':`, err);
            }
        }
    }

}