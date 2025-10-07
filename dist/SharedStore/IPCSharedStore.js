import cluster from 'cluster';
import { SharedStore } from './SharedStore.js';
export class IPCSharedStore extends SharedStore {
    _store = new Map();
    async init() {
        if (!cluster.isPrimary) {
            return;
        }
        cluster.on('message', (worker, msg) => {
            if (!msg || typeof msg !== 'object') {
                return;
            }
            const { type, key, value, requestId } = msg;
            switch (type) {
                case 'set':
                    this._store.set(key, value);
                    break;
                case 'delete':
                    this._store.delete(key);
                    break;
                case 'clear':
                    this._store.clear();
                    break;
                case 'get':
                    worker.send({
                        type: 'getResponse',
                        requestId,
                        key,
                        value: this._store.get(key)
                    });
                    break;
                case 'has':
                    worker.send({
                        type: 'hasResponse',
                        requestId,
                        key,
                        value: this._store.has(key)
                    });
                    break;
            }
        });
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
            process.send?.({ type, key, value, requestId });
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
            process.send?.({ type: 'set', key, value });
        }
    }
    async delete(key) {
        if (cluster.isPrimary) {
            this._store.delete(key);
        }
        else {
            process.send?.({ type: 'delete', key });
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
}
//# sourceMappingURL=IPCSharedStore.js.map