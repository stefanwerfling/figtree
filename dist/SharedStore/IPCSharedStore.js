import cluster from 'cluster';
import { Logger } from '../Logger/Logger.js';
import { SharedStore } from './SharedStore.js';
export class IPCSharedStore extends SharedStore {
    _store = new Map();
    _subscribers = new Map();
    async init() {
        if (cluster.isPrimary) {
            cluster.on('message', (worker, msg) => {
                if (!msg || typeof msg !== 'object') {
                    return;
                }
                this._handlePrimaryMessage(worker, msg);
            });
        }
        else {
            process.on('message', (msg) => {
                if (!msg || typeof msg !== 'object') {
                    return;
                }
                if (msg.type === 'pubsub' && typeof msg.channel === 'string') {
                    this._dispatchLocalSubscribers(msg.channel, msg.value);
                }
            });
        }
    }
    _handlePrimaryMessage(worker, msg) {
        switch (msg.type) {
            case 'set':
                this._store.set(msg.key, msg.value);
                break;
            case 'delete':
                this._store.delete(msg.key);
                break;
            case 'clear':
                this._store.clear();
                break;
            case 'get':
                worker.send({
                    type: 'getResponse',
                    requestId: msg.requestId,
                    key: msg.key,
                    value: this._store.get(msg.key)
                });
                break;
            case 'has':
                worker.send({
                    type: 'hasResponse',
                    requestId: msg.requestId,
                    key: msg.key,
                    value: this._store.has(msg.key)
                });
                break;
            case 'publish':
                this._fanOutPublish(msg.channel, msg.value);
                break;
            default:
                break;
        }
    }
    _sendAndWait(type, key, value) {
        return new Promise((resolve) => {
            const requestId = Math.random().toString(36).substring(2);
            const handler = (msg) => {
                if (msg.requestId === requestId) {
                    process.off('message', handler);
                    resolve(msg.value);
                }
            };
            process.on('message', handler);
            process.send?.({ type: type, key: key, value: value, requestId: requestId });
        });
    }
    async get(key) {
        if (cluster.isPrimary) {
            return this._store.get(key);
        }
        return this._sendAndWait('get', key);
    }
    async set(key, value) {
        if (cluster.isPrimary) {
            this._store.set(key, value);
        }
        else {
            process.send?.({ type: 'set', key: key, value: value });
        }
    }
    async delete(key) {
        if (cluster.isPrimary) {
            this._store.delete(key);
        }
        else {
            process.send?.({ type: 'delete', key: key });
        }
    }
    async has(key) {
        if (cluster.isPrimary) {
            return this._store.has(key);
        }
        return this._sendAndWait('has', key);
    }
    async clear() {
        if (cluster.isPrimary) {
            this._store.clear();
        }
        else {
            process.send?.({ type: 'clear' });
        }
    }
    async publish(channel, message) {
        if (cluster.isPrimary) {
            this._fanOutPublish(channel, message);
        }
        else {
            process.send?.({ type: 'publish', channel: channel, value: message });
        }
    }
    async subscribe(channel, callback) {
        let set = this._subscribers.get(channel);
        if (!set) {
            set = new Set();
            this._subscribers.set(channel, set);
        }
        set.add(callback);
    }
    async unsubscribe(channel, callback) {
        if (!callback) {
            this._subscribers.delete(channel);
            return;
        }
        const set = this._subscribers.get(channel);
        if (set) {
            set.delete(callback);
            if (set.size === 0) {
                this._subscribers.delete(channel);
            }
        }
    }
    _fanOutPublish(channel, message) {
        for (const w of Object.values(cluster.workers ?? {})) {
            if (!w || w.isDead()) {
                continue;
            }
            try {
                w.send({ type: 'pubsub', channel: channel, value: message });
            }
            catch (err) {
                Logger.getLogger().warn?.('IPCSharedStore::publish: failed to deliver to worker', err);
            }
        }
        this._dispatchLocalSubscribers(channel, message);
    }
    _dispatchLocalSubscribers(channel, message) {
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
            }
            catch (err) {
                Logger.getLogger().error?.(`IPCSharedStore::subscriber error on '${channel}':`, err);
            }
        }
    }
}
//# sourceMappingURL=IPCSharedStore.js.map