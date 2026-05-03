import {ClusterLease, ClusterLeaseOptions} from '../Cluster/ClusterLease.js';

/**
 * Subscriber callback signature. May be async.
 * @template T
 */
export type SharedStoreSubscriber<T = any> = (message: T) => void | Promise<void>;

/**
 * Abstract shared store
 */
export abstract class SharedStore {

    /**
     * Init the shared store
     */
    public abstract init(): Promise<void>;

    /**
     * Get value by key
     * @param {string} key
     * @return {T}
     * @template T
     */
    public abstract get<T = any>(key: string): Promise<T | undefined>;

    /**
     * Set a value by key.
     *
     * The optional `ttlMs` parameter expires the key after the given milliseconds.
     * - `RedisSharedStore` uses Redis' native `EX` option.
     * - `IPCSharedStore` schedules a `setTimeout` in the master process; the key
     *   is removed when the timeout fires (or earlier on explicit delete/clear).
     *
     * @param {string} key
     * @param {T} value
     * @param {number} ttlMs Optional time-to-live in milliseconds.
     * @template T
     */
    public abstract set<T = any>(key: string, value: T, ttlMs?: number): Promise<void>;

    /**
     * delete value by key
     * @param {string} key
     */
    public abstract delete(key: string): Promise<void>;

    /**
     * has a key in the store
     * @param {string} key
     * @return {boolean}
     */
    public abstract has(key: string): Promise<boolean>;

    /**
     * Clear the shared store
     */
    public abstract clear(): Promise<void>;

    /**
     * Return all keys that start with the given prefix. If no prefix is given,
     * returns all keys. The returned order is implementation-defined.
     * @param {string} prefix
     * @return {string[]}
     */
    public abstract keys(prefix?: string): Promise<string[]>;

    /**
     * Publish a message to all subscribers of a channel — across all workers
     * (and across hosts when using the Redis implementation).
     * The publishing process also receives the message via its own subscribers.
     * @param {string} channel
     * @param {T} message
     * @template T
     */
    public abstract publish<T = any>(channel: string, message: T): Promise<void>;

    /**
     * Subscribe to a channel. The callback fires for every message published
     * on that channel — including messages published by this same process.
     * Multiple subscribers per channel are supported.
     * @param {string} channel
     * @param {SharedStoreSubscriber<T>} callback
     * @template T
     */
    public abstract subscribe<T = any>(channel: string, callback: SharedStoreSubscriber<T>): Promise<void>;

    /**
     * Remove a subscription. If `callback` is provided, only that callback is
     * removed; otherwise all subscribers for the channel in this process are removed.
     * @param {string} channel
     * @param {SharedStoreSubscriber<T>} callback
     * @template T
     */
    public abstract unsubscribe<T = any>(channel: string, callback?: SharedStoreSubscriber<T>): Promise<void>;

    /**
     * Build a distributed lease backed by this store. Cluster + multi-host wide
     * exclusivity for the given `name`.
     * @param {string} name
     * @param {ClusterLeaseOptions} options
     * @return {ClusterLease}
     */
    public abstract createLease(name: string, options?: ClusterLeaseOptions): ClusterLease;

}