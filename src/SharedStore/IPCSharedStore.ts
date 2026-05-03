import cluster, {Worker} from 'cluster';
import {ClusterLease, ClusterLeaseOptions} from '../Cluster/ClusterLease.js';
import {Logger} from '../Logger/Logger.js';
import {IPCLease} from './IPCLease.js';
import {SharedStore, SharedStoreSubscriber} from './SharedStore.js';

/**
 * IPC message envelope used by IPCSharedStore.
 */
type IPCMessage = {
    type: string;
    key?: string;
    value?: any;
    expected?: any;
    requestId?: string;
    channel?: string;
    ttlMs?: number;
    prefix?: string;
};

/**
 * IPC Shared store
 */
export class IPCSharedStore extends SharedStore {

    /**
     * Store (master only).
     * @private
     */
    private _store = new Map<string, any>();

    /**
     * TTL timers per key (master only) — used to expire keys with ttlMs > 0.
     * @private
     */
    private _ttlTimers = new Map<string, NodeJS.Timeout>();

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
                this._setLocal(msg.key as string, msg.value, msg.ttlMs);
                break;

            case 'delete':
                this._deleteLocal(msg.key as string);
                break;

            case 'clear':
                this._clearLocal();
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

            case 'keys':
                worker.send({
                    type: 'keysResponse',
                    requestId: msg.requestId,
                    value: this._keysLocal(msg.prefix)
                });
                break;

            case 'setIfAbsent':
                worker.send({
                    type: 'setIfAbsentResponse',
                    requestId: msg.requestId,
                    value: this._setIfAbsentLocal(msg.key as string, msg.value, msg.ttlMs)
                });
                break;

            case 'compareAndSet':
                worker.send({
                    type: 'compareAndSetResponse',
                    requestId: msg.requestId,
                    value: this._compareAndSetLocal(msg.key as string, msg.expected, msg.value, msg.ttlMs)
                });
                break;

            case 'deleteIfEqual':
                worker.send({
                    type: 'deleteIfEqualResponse',
                    requestId: msg.requestId,
                    value: this._deleteIfEqualLocal(msg.key as string, msg.expected)
                });
                break;

            case 'publish':
                this._fanOutPublish(msg.channel as string, msg.value);
                break;

            default:
                break;
        }
    }

    /**
     * Master-only: atomic "set if key is absent (or expired)".
     * @param {string} key
     * @param {any} value
     * @param {number} ttlMs
     * @return {boolean}
     * @private
     */
    private _setIfAbsentLocal(key: string, value: any, ttlMs?: number): boolean {
        if (this._store.has(key)) {
            return false;
        }

        this._setLocal(key, value, ttlMs);
        return true;
    }

    /**
     * Master-only: atomic "set value to `next` only if current value equals
     * `expected`". Refreshes TTL when ttlMs is provided.
     * @param {string} key
     * @param {any} expected
     * @param {any} next
     * @param {number} ttlMs
     * @return {boolean}
     * @private
     */
    private _compareAndSetLocal(key: string, expected: any, next: any, ttlMs?: number): boolean {
        if (!this._store.has(key)) {
            return false;
        }

        const current = this._store.get(key);

        if (current !== expected) {
            return false;
        }

        this._setLocal(key, next, ttlMs);
        return true;
    }

    /**
     * Master-only: atomic "delete only if current value equals `expected`".
     * @param {string} key
     * @param {any} expected
     * @return {boolean}
     * @private
     */
    private _deleteIfEqualLocal(key: string, expected: any): boolean {
        if (!this._store.has(key)) {
            return false;
        }

        const current = this._store.get(key);

        if (current !== expected) {
            return false;
        }

        this._deleteLocal(key);
        return true;
    }

    /**
     * Master-only: write to the local map and schedule TTL expiry if requested.
     * @param {string} key
     * @param {any} value
     * @param {number} ttlMs
     * @private
     */
    private _setLocal(key: string, value: any, ttlMs?: number): void {
        this._store.set(key, value);

        const previousTimer = this._ttlTimers.get(key);

        if (previousTimer) {
            clearTimeout(previousTimer);
            this._ttlTimers.delete(key);
        }

        if (ttlMs && ttlMs > 0) {
            const timer = setTimeout(() => {
                this._store.delete(key);
                this._ttlTimers.delete(key);
            }, ttlMs);
            this._ttlTimers.set(key, timer);
        }
    }

    /**
     * Master-only: delete a key and cancel its TTL timer if any.
     * @param {string} key
     * @private
     */
    private _deleteLocal(key: string): void {
        this._store.delete(key);

        const timer = this._ttlTimers.get(key);

        if (timer) {
            clearTimeout(timer);
            this._ttlTimers.delete(key);
        }
    }

    /**
     * Master-only: clear all keys and cancel all TTL timers.
     * @private
     */
    private _clearLocal(): void {
        for (const timer of this._ttlTimers.values()) {
            clearTimeout(timer);
        }

        this._ttlTimers.clear();
        this._store.clear();
    }

    /**
     * Master-only: return all keys (optionally filtered by prefix).
     * @param {string} prefix
     * @return {string[]}
     * @private
     */
    private _keysLocal(prefix?: string): string[] {
        const all = Array.from(this._store.keys());

        if (!prefix) {
            return all;
        }

        return all.filter((k) => k.startsWith(prefix));
    }

    private _sendAndWait<T>(type: string, payload: Partial<IPCMessage> = {}): Promise<T> {
        return new Promise((resolve) => {
            const requestId = Math.random().toString(36).substring(2);

            const handler = (msg: IPCMessage): void => {
                if (msg.requestId === requestId) {
                    process.off('message', handler);
                    resolve(msg.value as T);
                }
            };

            process.on('message', handler);
            process.send?.({ ...payload, type: type, requestId: requestId });
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

        return this._sendAndWait<T>('get', { key: key });
    }

    /**
     * Set a value by key.
     * @param {string} key
     * @param {T} value
     * @param {number} ttlMs Optional time-to-live in milliseconds (master schedules a setTimeout).
     * @template T
     */
    public async set<T = any>(key: string, value: T, ttlMs?: number): Promise<void> {
        if (cluster.isPrimary) {
            this._setLocal(key, value, ttlMs);
        } else {
            process.send?.({ type: 'set', key: key, value: value, ttlMs: ttlMs });
        }
    }

    /**
     * delete value by key
     * @param {string} key
     */
    public async delete(key: string): Promise<void> {
        if (cluster.isPrimary) {
            this._deleteLocal(key);
        } else {
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

        return this._sendAndWait<boolean>('has', { key: key });
    }

    /**
     * Clear the shared store
     */
    public async clear(): Promise<void> {
        if (cluster.isPrimary) {
            this._clearLocal();
        } else {
            process.send?.({ type: 'clear' });
        }
    }

    /**
     * Return all keys, optionally filtered by prefix.
     * @param {string} prefix
     * @return {string[]}
     */
    public async keys(prefix?: string): Promise<string[]> {
        if (cluster.isPrimary) {
            return this._keysLocal(prefix);
        }

        return this._sendAndWait<string[]>('keys', { prefix: prefix });
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
     * Internal — used by IPCLease. Atomic "set if absent".
     * @param {string} key
     * @param {any} value
     * @param {number} ttlMs
     * @return {boolean}
     */
    public async _setIfAbsent(key: string, value: any, ttlMs?: number): Promise<boolean> {
        if (cluster.isPrimary) {
            return this._setIfAbsentLocal(key, value, ttlMs);
        }

        return this._sendAndWait<boolean>('setIfAbsent', { key: key, value: value, ttlMs: ttlMs });
    }

    /**
     * Internal — used by IPCLease. Atomic "set if value matches expected".
     * @param {string} key
     * @param {any} expected
     * @param {any} next
     * @param {number} ttlMs
     * @return {boolean}
     */
    public async _compareAndSet(key: string, expected: any, next: any, ttlMs?: number): Promise<boolean> {
        if (cluster.isPrimary) {
            return this._compareAndSetLocal(key, expected, next, ttlMs);
        }

        return this._sendAndWait<boolean>(
            'compareAndSet',
            { key: key, expected: expected, value: next, ttlMs: ttlMs }
        );
    }

    /**
     * Internal — used by IPCLease. Atomic "delete if value matches expected".
     * @param {string} key
     * @param {any} expected
     * @return {boolean}
     */
    public async _deleteIfEqual(key: string, expected: any): Promise<boolean> {
        if (cluster.isPrimary) {
            return this._deleteIfEqualLocal(key, expected);
        }

        return this._sendAndWait<boolean>('deleteIfEqual', { key: key, expected: expected });
    }

    /**
     * Build a distributed lease backed by this IPC store.
     * @param {string} name
     * @param {ClusterLeaseOptions} options
     * @return {ClusterLease}
     */
    public createLease(name: string, options?: ClusterLeaseOptions): ClusterLease {
        return new IPCLease(this, name, options);
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