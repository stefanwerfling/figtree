import {RedisClient} from '../Db/RedisDb/RedisClient.js';
import {SharedStore} from './SharedStore.js';

/**
 * RedisSharedStore
 */
export class RedisSharedStore extends SharedStore {

    /**
     * Redis client
     * @private
     */
    private readonly _client: RedisClient;

    /**
     * Namespace for the keys on redis
     * @private
     */
    private readonly _namespace: string;

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
     * Set a value by key
     * @param {string} key
     * @param {T} value
     * @template T
     */
    public async set<T = any>(key: string, value: T): Promise<void> {
        return this._client.set(key, value, this._namespace);
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
}