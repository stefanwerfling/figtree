import { RedisClient } from '../Db/RedisDb/RedisClient.js';
import { SharedStore } from './SharedStore.js';
export class RedisSharedStore extends SharedStore {
    _client;
    _namespace;
    constructor(client, namespace = 'sharedstore') {
        super();
        this._client = client ?? RedisClient.getInstance();
        this._namespace = namespace;
    }
    async init() {
        if (!this._client.isConnected()) {
            await this._client.connect();
        }
    }
    async get(key) {
        const value = await this._client.get(key, this._namespace);
        return value ?? undefined;
    }
    async set(key, value) {
        return this._client.set(key, value, this._namespace);
    }
    async has(key) {
        return this._client.has(key, this._namespace);
    }
    async delete(key) {
        return this._client.unlink(key, this._namespace);
    }
    async clear() {
        if (this._namespace) {
            await this._client.clearNamespace(this._namespace);
        }
        else {
            await this._client.clearAll();
        }
    }
}
//# sourceMappingURL=RedisSharedStore.js.map