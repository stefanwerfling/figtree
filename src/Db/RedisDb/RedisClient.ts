import {createClient, RedisClientType} from 'redis';
import {Logger} from '../../Logger/Logger.js';
import {RedisChannel} from './RedisChannel.js';

/**
 * Redis client options
 */
export type RedisClientOptions = {
    url: string;
    password?: string;
};

/**
 * Function channel callback
 */
export type FunChannelCallback = (message: string) => Promise<void>;

/**
 * Redis client object
 */
export class RedisClient {

    /**
     * Instance from RedisClient
     * @protected
     */
    protected static _instance: RedisClient|null = null;

    /**
     * Return an instance from RedisClient
     * @param {RedisClientOptions} options
     * @returns {RedisClient}
     */
    public static getInstance(options?: RedisClientOptions): RedisClient {
        if (RedisClient._instance === null) {
            if (options) {
                RedisClient._instance = new RedisClient(options);
            } else {
                throw new Error('RedisClient::getInstance: Option not set for Redis client init!');
            }
        }

        return RedisClient._instance;
    }

    /**
     * Return has an instance
     */
    public static hasInstance(): boolean {
        return RedisClient._instance !== null;
    }

    /**
     * Client object
     * @protected
     */
    protected _client: RedisClientType;

    /**
     * Stored options — used by duplicate().
     * @protected
     */
    protected _options: RedisClientOptions;

    /**
     * Is Connected
     * @protected
     */
    protected _isConnect: boolean = false;

    /**
     * Constructor
     * @param {RedisClientOptions} options
     */
    public constructor(options: RedisClientOptions) {
        this._options = options;

        if (options.password) {
            this._client = createClient({
                url: options.url,
                password: options.password
            });
        } else {
            this._client = createClient({
                url: options.url,
            });
        }

        this._client.on('error', (err) => {
            Logger.getLogger().error('RedisClient::client::error: Redis Client Error', err);
        });
    }

    /**
     * Create a connected sibling client that shares the same options.
     * Required for Pub/Sub: a connection that has called `subscribe` cannot
     * issue regular commands, so a separate connection is needed.
     * @return {RedisClient}
     */
    public async duplicate(): Promise<RedisClient> {
        const sibling = new RedisClient(this._options);
        await sibling.connect();

        return sibling;
    }

    /**
     * Subscribe to a Redis channel. The callback receives the raw message string.
     * @param {string} channel
     * @param {FunChannelCallback} callback
     */
    public async subscribe(channel: string, callback: FunChannelCallback): Promise<void> {
        if (!this._isConnect) {
            throw new Error('RedisClient::subscribe: client is not connected');
        }

        await this._client.subscribe(channel, async(message) => {
            await callback(message);
        });
    }

    /**
     * Unsubscribe from a Redis channel.
     * @param {string} channel
     */
    public async unsubscribe(channel: string): Promise<void> {
        if (!this._isConnect) {
            return;
        }

        await this._client.unsubscribe(channel);
    }

    /**
     * Connect to server
     */
    public async connect(): Promise<void> {
        await this._client.connect();
        this._isConnect = true;
    }

    /**
     * Disconnect from server
     */
    public async disconnect(): Promise<void> {
        if (!this._isConnect) {
            return;
        }

        await this._client.disconnect();
        this._isConnect = false;
    }

    /**
     * register a channel
     * @param {string} channel
     * @param {FunChannelCallback} callback
     */
    protected async _registerChannel(channel: string, callback: FunChannelCallback): Promise<void> {
        if (!this._isConnect) {
            return;
        }

        await this._client.subscribe(channel, async(message) => {
            await callback(message);
        });
    }

    /**
     * Register channels
     * @param {RedisChannel<any>[]} channels
     */
    public async registerChannels(channels: RedisChannel<any>[]): Promise<void> {
        for await (const channel of channels) {
            await this._registerChannel(
                channel.getName(),
                async(message: string): Promise<void> => {
                    try {
                        const data = JSON.parse(message);
                        await channel.listen(data);
                    } catch (e) {
                        Logger.getLogger().error('RedisClient::registerChannels: Redis client channel resive data parse error!', e);
                    }
                }
            );
        }
    }

    /**
     * sendChannel
     * @param {string} channel
     * @param {string} data
     */
    public async sendChannel(channel: string, data: string): Promise<void> {
        await this._client.publish(channel, data);
    }

    /**
     * Return is connected
     * @return {boolean}
     */
    public isConnected(): boolean {
        try {
            return this._client.isOpen && this._client.isReady;
        } catch {
            return false;
        }
    }

    /**
     * Build the key for namespace
     * @param {string} key
     * @param {string} namespace
     * @return {string}
     * @protected
     */
    protected _buildKey(key: string, namespace?: string): string {
        if (!namespace) {
            return key;
        }

        const normalizedNs = namespace.endsWith(':') ? namespace : `${namespace  }:`;
        return `${normalizedNs}${key}`;
    }

    /**
     * Get value by key (and namespace)
     * @param {string} key
     * @param {string} namespace
     * @return {T|null}
     * @template T = any
     */
    public async get<T = any>(key: string, namespace?: string): Promise<T|null> {
        const rkey = this._buildKey(key, namespace);
        const raw = await this._client.get(rkey);

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    /**
     * Set the value by key.
     * @param {string} key
     * @param {T} value
     * @param {string} namespace
     * @param {number} ttlMs Optional TTL in milliseconds — uses Redis `PX` option.
     * @template T = any
     */
    public async set<T = any>(key: string, value: T, namespace?: string, ttlMs?: number): Promise<void> {
        const rkey = this._buildKey(key, namespace);

        if (ttlMs && ttlMs > 0) {
            await this._client.set(rkey, JSON.stringify(value), { PX: ttlMs });
        } else {
            await this._client.set(rkey, JSON.stringify(value));
        }
    }

    /**
     * Scan keys matching a glob pattern and return them.
     * @param {string} pattern
     * @return {string[]}
     */
    public async scanKeys(pattern: string): Promise<string[]> {
        if (!this.isConnected()) {
            return [];
        }

        const keys: string[] = [];

        for await (const key of this._client.scanIterator({ MATCH: pattern })) {
            keys.push(key);
        }

        return keys;
    }

    /**
     * Delete the value by key
     * @param {string} key
     * @param {string} namespace
     */
    public async delete(key: string, namespace?: string): Promise<void> {
        const rkey = this._buildKey(key, namespace);
        await this._client.del(rkey);
    }

    /**
     * Unlink a delete witout blocking
     * @param {string} key
     * @param {string} namespace
     */
    public async unlink(key: string, namespace?: string): Promise<void> {
        const rkey = this._buildKey(key, namespace);
        await this._client.unlink(rkey);
    }

    /**
     * has a value by key
     * @param {string} key
     * @param {string} namespace
     * @return {boolean}
     */
    public async has(key: string, namespace?: string): Promise<boolean> {
        const rkey = this._buildKey(key, namespace);
        const exists = await this._client.exists(rkey);

        return exists === 1;
    }

    /**
     * clear all
     */
    public async clearAll(): Promise<void> {
        await this._client.flushDb();
    }

    /**
     * clear all by namespace
     * @param {string} namespace
     */
    public async clearNamespace(namespace: string): Promise<void> {
        if (!this.isConnected()) {
            return;
        }

        const keys: string[] = [];

        for await (const key of this._client.scanIterator({ MATCH: `${namespace}:*` })) {
            keys.push(key);
        }

        if (keys.length > 0) {
            await this._client.unlink(keys);
        }
    }

}