import cluster from 'cluster';
import {SharedStore} from './SharedStore.js';

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
     * Init the shared store
     */
    public async init(): Promise<void> {
        if (!cluster.isPrimary) {
            return;
        }

        cluster.on('message', (worker, msg: any) => {
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

    private _sendAndWait<T>(type: string, key?: string, value?: any): Promise<T> {
        return new Promise((resolve) => {
            const requestId = Math.random().toString(36).substring(2);

            const handler = (msg: any) => {
                if (msg.requestId === requestId) {
                    process.off('message', handler);
                    resolve(msg.value);
                }
            };

            process.on('message', handler);
            process.send?.({ type, key, value, requestId });
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
            process.send?.({ type: 'set', key, value });
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
            process.send?.({ type: 'delete', key });
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

}