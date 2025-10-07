import { createClient } from 'redis';
import { Logger } from '../../Logger/Logger.js';
export class RedisClient {
    static _instance = null;
    static getInstance(options) {
        if (RedisClient._instance === null) {
            if (options) {
                RedisClient._instance = new RedisClient(options);
            }
            else {
                throw new Error('RedisClient::getInstance: Option not set for Redis client init!');
            }
        }
        return RedisClient._instance;
    }
    static hasInstance() {
        return RedisClient._instance !== null;
    }
    _client;
    _isConnect = false;
    constructor(options) {
        if (options.password) {
            this._client = createClient({
                url: options.url,
                password: options.password
            });
        }
        else {
            this._client = createClient({
                url: options.url,
            });
        }
        this._client.on('error', (err) => {
            Logger.getLogger().error('RedisClient::client::error: Redis Client Error', err);
        });
    }
    async connect() {
        if (await this._client.connect()) {
            this._isConnect = true;
        }
    }
    async disconnect() {
        if (!this._isConnect) {
            return;
        }
        await this._client.disconnect();
        this._isConnect = false;
    }
    async _registerChannel(channel, callback) {
        if (!this._isConnect) {
            return;
        }
        await this._client.subscribe(channel, async (message) => {
            await callback(message);
        });
    }
    async registerChannels(channels) {
        for await (const channel of channels) {
            await this._registerChannel(channel.getName(), async (message) => {
                try {
                    const data = JSON.parse(message);
                    await channel.listen(data);
                }
                catch (e) {
                    Logger.getLogger().error('RedisClient::registerChannels: Redis client channel resive data parse error!', e);
                }
            });
        }
    }
    async sendChannel(channel, data) {
        await this._client.publish(channel, data);
    }
    isConnected() {
        try {
            return this._client.isOpen && this._client.isReady;
        }
        catch {
            return false;
        }
    }
    _buildKey(key, namespace) {
        if (!namespace) {
            return key;
        }
        const normalizedNs = namespace.endsWith(':') ? namespace : namespace + ':';
        return `${normalizedNs}${key}`;
    }
    async get(key, namespace) {
        const rkey = this._buildKey(key, namespace);
        const raw = await this._client.get(rkey);
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async set(key, value, namespace) {
        const rkey = this._buildKey(key, namespace);
        await this._client.set(rkey, JSON.stringify(value));
    }
    async delete(key, namespace) {
        const rkey = this._buildKey(key, namespace);
        await this._client.del(rkey);
    }
    async unlink(key, namespace) {
        const rkey = this._buildKey(key, namespace);
        await this._client.unlink(rkey);
    }
    async has(key, namespace) {
        const rkey = this._buildKey(key, namespace);
        const exists = await this._client.exists(rkey);
        return exists === 1;
    }
    async clearAll() {
        await this._client.flushDb();
    }
    async clearNamespace(namespace) {
        if (!this.isConnected()) {
            return;
        }
        const keys = [];
        for await (const key of this._client.scanIterator({ MATCH: `${namespace}:*` })) {
            keys.push(key);
        }
        if (keys.length > 0) {
            await this._client.unlink(keys);
        }
    }
}
//# sourceMappingURL=RedisClient.js.map