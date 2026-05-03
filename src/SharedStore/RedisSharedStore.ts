import {ClusterLease, ClusterLeaseOptions} from '../Cluster/ClusterLease.js';
import {RedisClient} from '../Db/RedisDb/RedisClient.js';
import {Logger} from '../Logger/Logger.js';
import {RedisLease} from './RedisLease.js';
import {SharedStore, SharedStoreSubscriber} from './SharedStore.js';

/**
 * RedisSharedStore
 */
export class RedisSharedStore extends SharedStore {

    /**
     * Redis client (regular commands).
     * @private
     */
    private readonly _client: RedisClient;

    /**
     * Namespace for the keys / channels in redis
     * @private
     */
    private readonly _namespace: string;

    /**
     * Dedicated subscriber client (Redis Pub/Sub requires a separate connection
     * since a subscribed connection cannot issue regular commands). Lazy-created
     * on first subscribe.
     * @private
     */
    private _subscriberClient: RedisClient | null = null;

    /**
     * Local pub/sub subscribers — channel name → set of callbacks for THIS process.
     * @private
     */
    private _subscribers = new Map<string, Set<SharedStoreSubscriber>>();

    /**
     * Constructor
     * @param {RedisClient} client
     * @param {string} namespace
     */
    public constructor(client?: RedisClient, namespace: string = 'sharedstore') {
        super();
        this._client = client ?? RedisClient.getInstance();
        this._namespace = namespace;
    }

    /**
     * Init
     */
    public async init(): Promise<void> {
        if (!this._client.isConnected()) {
            await this._client.connect();
        }
    }

    /**
     * Get a value by key
     * @param {string} key
     * @return {T|undefined}
     * @template T
     */
    public async get<T = any>(key: string): Promise<T | undefined> {
        const value = await this._client.get<T>(key, this._namespace);
        return value ?? undefined;
    }

    /**
     * Set a value by key.
     * @param {string} key
     * @param {T} value
     * @param {number} ttlMs Optional time-to-live in milliseconds (Redis `PX`).
     * @template T
     */
    public async set<T = any>(key: string, value: T, ttlMs?: number): Promise<void> {
        return this._client.set(key, value, this._namespace, ttlMs);
    }

    /**
     * Return all keys (in the namespace) matching the given prefix. Returned
     * keys are namespace-stripped — i.e. relative to the configured namespace.
     * @param {string} prefix
     * @return {string[]}
     */
    public async keys(prefix?: string): Promise<string[]> {
        const nsPrefix = this._namespace ? `${this._namespace}:` : '';
        const pattern = `${nsPrefix}${prefix ?? ''}*`;
        const fullKeys = await this._client.scanKeys(pattern);

        if (!nsPrefix) {
            return fullKeys;
        }

        return fullKeys.map((k) => k.startsWith(nsPrefix) ? k.substring(nsPrefix.length) : k);
    }

    /**
     * has a key in the store
     * @param {string} key
     * @return {boolean}
     */
    public async has(key: string): Promise<boolean> {
        return this._client.has(key, this._namespace);
    }

    /**
     * delete value by key
     * @param {string} key
     */
    public async delete(key: string): Promise<void> {
        return this._client.unlink(key, this._namespace);
    }

    /**
     * Clear the shared store
     */
    public async clear(): Promise<void> {
        if (this._namespace) {
            await this._client.clearNamespace(this._namespace);
        } else {
            await this._client.clearAll();
        }
    }

    /**
     * Publish a message on the channel via Redis (cluster + multi-host wide).
     * @param {string} channel
     * @param {T} message
     * @template T
     */
    public async publish<T = any>(channel: string, message: T): Promise<void> {
        await this._client.sendChannel(this._namespacedChannel(channel), JSON.stringify(message));
    }

    /**
     * Subscribe to a channel. The first subscription on a channel triggers a
     * native Redis SUBSCRIBE on a dedicated connection; subsequent subscribers
     * fan out locally.
     * @param {string} channel
     * @param {SharedStoreSubscriber<T>} callback
     * @template T
     */
    public async subscribe<T = any>(channel: string, callback: SharedStoreSubscriber<T>): Promise<void> {
        let set = this._subscribers.get(channel);

        if (!set) {
            set = new Set();
            this._subscribers.set(channel, set);

            const subscriber = await this._getSubscriberClient();
            const ns = this._namespacedChannel(channel);

            await subscriber.subscribe(ns, async(raw: string): Promise<void> => {
                this._dispatchLocalSubscribers(channel, raw);
            });
        }

        set.add(callback as SharedStoreSubscriber);
    }

    /**
     * Unsubscribe from a channel. If `callback` is omitted, removes all subscribers
     * for the channel in this process and unsubscribes from the underlying Redis channel.
     * @param {string} channel
     * @param {SharedStoreSubscriber<T>} callback
     * @template T
     */
    public async unsubscribe<T = any>(channel: string, callback?: SharedStoreSubscriber<T>): Promise<void> {
        const set = this._subscribers.get(channel);

        if (!set) {
            return;
        }

        if (callback) {
            set.delete(callback as SharedStoreSubscriber);

            if (set.size > 0) {
                return;
            }
        }

        this._subscribers.delete(channel);

        if (this._subscriberClient) {
            try {
                await this._subscriberClient.unsubscribe(this._namespacedChannel(channel));
            } catch (err) {
                Logger.getLogger().warn?.('RedisSharedStore::unsubscribe: redis unsubscribe failed', err);
            }
        }
    }

    /**
     * Build a distributed lease backed by Redis. Atomic via SET NX PX +
     * tiny server-side Lua scripts for renew / release.
     * @param {string} name
     * @param {ClusterLeaseOptions} options
     * @return {ClusterLease}
     */
    public createLease(name: string, options?: ClusterLeaseOptions): ClusterLease {
        return new RedisLease(this._client, this._namespace, name, options);
    }

    /**
     * Lazy-create the subscriber client (Pub/Sub requires a dedicated connection).
     * @return {RedisClient}
     * @private
     */
    private async _getSubscriberClient(): Promise<RedisClient> {
        if (!this._subscriberClient) {
            this._subscriberClient = await this._client.duplicate();
        }

        return this._subscriberClient;
    }

    /**
     * Build the namespaced channel name (`<namespace>:<channel>`).
     * @param {string} channel
     * @return {string}
     * @private
     */
    private _namespacedChannel(channel: string): string {
        if (!this._namespace) {
            return channel;
        }

        return `${this._namespace}:${channel}`;
    }

    /**
     * Dispatch a raw redis message to all local subscribers of the channel.
     * @param {string} channel
     * @param {string} raw
     * @private
     */
    private _dispatchLocalSubscribers(channel: string, raw: string): void {
        const set = this._subscribers.get(channel);

        if (!set || set.size === 0) {
            return;
        }

        let message: any;

        try {
            message = JSON.parse(raw);
        } catch (err) {
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
            } catch (err) {
                Logger.getLogger().error?.(`RedisSharedStore::subscriber error on '${channel}':`, err);
            }
        }
    }

}