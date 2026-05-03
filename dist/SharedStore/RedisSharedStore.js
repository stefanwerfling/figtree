import { RedisClient } from '../Db/RedisDb/RedisClient.js';
import { Logger } from '../Logger/Logger.js';
import { RedisLease } from './RedisLease.js';
import { SharedStore } from './SharedStore.js';
export class RedisSharedStore extends SharedStore {
    _client;
    _namespace;
    _subscriberClient = null;
    _subscribers = new Map();
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
    async set(key, value, ttlMs) {
        return this._client.set(key, value, this._namespace, ttlMs);
    }
    async keys(prefix) {
        const nsPrefix = this._namespace ? `${this._namespace}:` : '';
        const pattern = `${nsPrefix}${prefix ?? ''}*`;
        const fullKeys = await this._client.scanKeys(pattern);
        if (!nsPrefix) {
            return fullKeys;
        }
        return fullKeys.map((k) => k.startsWith(nsPrefix) ? k.substring(nsPrefix.length) : k);
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
    async publish(channel, message) {
        await this._client.sendChannel(this._namespacedChannel(channel), JSON.stringify(message));
    }
    async subscribe(channel, callback) {
        let set = this._subscribers.get(channel);
        if (!set) {
            set = new Set();
            this._subscribers.set(channel, set);
            const subscriber = await this._getSubscriberClient();
            const ns = this._namespacedChannel(channel);
            await subscriber.subscribe(ns, async (raw) => {
                this._dispatchLocalSubscribers(channel, raw);
            });
        }
        set.add(callback);
    }
    async unsubscribe(channel, callback) {
        const set = this._subscribers.get(channel);
        if (!set) {
            return;
        }
        if (callback) {
            set.delete(callback);
            if (set.size > 0) {
                return;
            }
        }
        this._subscribers.delete(channel);
        if (this._subscriberClient) {
            try {
                await this._subscriberClient.unsubscribe(this._namespacedChannel(channel));
            }
            catch (err) {
                Logger.getLogger().warn?.('RedisSharedStore::unsubscribe: redis unsubscribe failed', err);
            }
        }
    }
    createLease(name, options) {
        return new RedisLease(this._client, this._namespace, name, options);
    }
    async _getSubscriberClient() {
        if (!this._subscriberClient) {
            this._subscriberClient = await this._client.duplicate();
        }
        return this._subscriberClient;
    }
    _namespacedChannel(channel) {
        if (!this._namespace) {
            return channel;
        }
        return `${this._namespace}:${channel}`;
    }
    _dispatchLocalSubscribers(channel, raw) {
        const set = this._subscribers.get(channel);
        if (!set || set.size === 0) {
            return;
        }
        let message;
        try {
            message = JSON.parse(raw);
        }
        catch (err) {
            Logger.getLogger().error?.(`RedisSharedStore::dispatch: JSON parse error on '${channel}'`, err);
            return;
        }
        for (const cb of set) {
            try {
                const ret = cb(message);
                if (ret instanceof Promise) {
                    ret.catch((err) => {
                        Logger.getLogger().error?.(`RedisSharedStore::subscriber error on '${channel}':`, err);
                    });
                }
            }
            catch (err) {
                Logger.getLogger().error?.(`RedisSharedStore::subscriber error on '${channel}':`, err);
            }
        }
    }
}
//# sourceMappingURL=RedisSharedStore.js.map