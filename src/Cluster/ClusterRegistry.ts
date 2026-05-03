import {Logger} from '../Logger/Logger.js';
import {SharedStore} from '../SharedStore/SharedStore.js';
import {BackendCluster} from '../Application/BackendCluster.js';
import {ClusterPublishable} from './ClusterPublishable.js';

/**
 * ClusterRegistry options.
 */
export type ClusterRegistryOptions = {
    /**
     * Heartbeat interval in ms. Each tick writes every registered publishable's
     * state to the shared store. Default 10_000 (10s).
     */
    heartbeatMs?: number;
    /**
     * Time-to-live for each entry in ms. Should be larger than `heartbeatMs`
     * (typically 3×) so a single missed heartbeat does not expire the entry.
     * Default 30_000 (30s). Only honored by `RedisSharedStore`; in
     * `IPCSharedStore` it triggers a setTimeout-based cleanup.
     */
    ttlMs?: number;
};

const DEFAULT_HEARTBEAT_MS = 10_000;
const DEFAULT_TTL_MS = 30_000;
const KEY_PREFIX = 'cluster';

/**
 * ClusterRegistry — generic abstraction for "this class wants to publish its
 * state cluster-wide".
 *
 * Each registered `ClusterPublishable` is serialized on every heartbeat and
 * written to the underlying `SharedStore`. Other workers (and other hosts when
 * `RedisSharedStore` points at a shared Redis) can query the merged view via
 * `queryAll(namespace)`.
 *
 * Worker identity is determined by `BackendCluster.getWorkerId()`
 * (`<hostname>:<pid>`), so entries from dead workers naturally expire via TTL.
 *
 * @example
 *   class JobQueue implements ClusterPublishable {
 *       public getNamespace(): string { return 'job-queue'; }
 *       public serialize(): unknown { return { depth: this._queue.length }; }
 *   }
 *
 *   const registry = new ClusterRegistry(store);
 *   registry.register(new JobQueue());
 *   await registry.start();
 *
 *   const all = await registry.queryAll<{depth: number}>('job-queue');
 *   // → { 'host1:1234': {depth: 5}, 'host2:5678': {depth: 12} }
 */
export class ClusterRegistry {

    /**
     * Singleton instance. Optional — the registry can also be used directly.
     * @private
     */
    private static _instance: ClusterRegistry | null = null;

    /**
     * Configure the singleton instance. Must be called once before
     * `getInstance()` is used.
     * @param {SharedStore} store
     * @param {ClusterRegistryOptions} options
     * @return {ClusterRegistry}
     */
    public static initialize(store: SharedStore, options?: ClusterRegistryOptions): ClusterRegistry {
        ClusterRegistry._instance = new ClusterRegistry(store, options);
        return ClusterRegistry._instance;
    }

    /**
     * Return the singleton instance.
     * @return {ClusterRegistry}
     */
    public static getInstance(): ClusterRegistry {
        if (ClusterRegistry._instance === null) {
            throw new Error('ClusterRegistry::getInstance: not initialized — call initialize(store) first');
        }

        return ClusterRegistry._instance;
    }

    /**
     * Has the singleton been configured?
     * @return {boolean}
     */
    public static hasInstance(): boolean {
        return ClusterRegistry._instance !== null;
    }

    /**
     * Build the storage key for a namespace + worker id.
     * @param {string} namespace
     * @param {string} workerId
     * @return {string}
     */
    public static buildKey(namespace: string, workerId: string): string {
        return `${KEY_PREFIX}:${namespace}:${workerId}`;
    }

    /**
     * Build the prefix used to scan all entries of a namespace.
     * @param {string} namespace
     * @return {string}
     */
    public static buildPrefix(namespace: string): string {
        return `${KEY_PREFIX}:${namespace}:`;
    }

    private readonly _store: SharedStore;
    private readonly _heartbeatMs: number;
    private readonly _ttlMs: number;
    private readonly _items: ClusterPublishable[] = [];
    private _timer: NodeJS.Timeout | null = null;
    private _running = false;

    /**
     * Constructor.
     * @param {SharedStore} store
     * @param {ClusterRegistryOptions} options
     */
    public constructor(store: SharedStore, options?: ClusterRegistryOptions) {
        this._store = store;
        this._heartbeatMs = options?.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
        this._ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
    }

    /**
     * Register a publishable. Subsequent heartbeats will include it.
     * Registering the same object twice is a no-op.
     * @param {ClusterPublishable} item
     */
    public register(item: ClusterPublishable): void {
        if (!this._items.includes(item)) {
            this._items.push(item);
        }
    }

    /**
     * Unregister a publishable. Its entry is removed from the shared store
     * immediately; subsequent heartbeats no longer include it.
     * @param {ClusterPublishable} item
     */
    public async unregister(item: ClusterPublishable): Promise<void> {
        const index = this._items.indexOf(item);

        if (index >= 0) {
            this._items.splice(index, 1);
        }

        const key = ClusterRegistry.buildKey(item.getNamespace(), BackendCluster.getWorkerId());

        try {
            await this._store.delete(key);
        } catch (err) {
            Logger.getLogger().warn?.(`ClusterRegistry::unregister: delete failed for ${key}`, err);
        }
    }

    /**
     * Start the heartbeat. The first tick runs immediately so registered items
     * are visible without waiting one full interval.
     */
    public async start(): Promise<void> {
        if (this._running) {
            return;
        }

        this._running = true;
        await this._tick();

        this._timer = setInterval(() => {
            this._tick().catch((err) => {
                Logger.getLogger().error?.('ClusterRegistry::tick error', err);
            });
        }, this._heartbeatMs);
    }

    /**
     * Stop the heartbeat and remove this worker's entries from the shared store.
     */
    public async stop(): Promise<void> {
        if (!this._running) {
            return;
        }

        this._running = false;

        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }

        const workerId = BackendCluster.getWorkerId();

        await Promise.all(this._items.map(async(item) => {
            const key = ClusterRegistry.buildKey(item.getNamespace(), workerId);

            try {
                await this._store.delete(key);
            } catch (err) {
                Logger.getLogger().warn?.(`ClusterRegistry::stop: delete failed for ${key}`, err);
            }
        }));
    }

    /**
     * Query all entries in a namespace cluster-wide.
     *
     * @param {string} namespace
     * @return {Record<string, T>}  workerId → serialized state
     * @template T
     */
    public async queryAll<T = unknown>(namespace: string): Promise<Record<string, T>> {
        const prefix = ClusterRegistry.buildPrefix(namespace);
        const keys = await this._store.keys(prefix);
        const result: Record<string, T> = {};

        await Promise.all(keys.map(async(key) => {
            const value = await this._store.get<T>(key);

            if (value !== undefined) {
                const workerId = key.substring(prefix.length);
                result[workerId] = value;
            }
        }));

        return result;
    }

    /**
     * Return this worker's own entry for the namespace, or null if not present.
     * @param {string} namespace
     * @return {T|null}
     * @template T
     */
    public async queryOwn<T = unknown>(namespace: string): Promise<T | null> {
        const key = ClusterRegistry.buildKey(namespace, BackendCluster.getWorkerId());
        const value = await this._store.get<T>(key);

        return value ?? null;
    }

    /**
     * One heartbeat tick — serialize every registered item and write it to the
     * shared store under `cluster:<namespace>:<workerId>` with the configured TTL.
     * @private
     */
    private async _tick(): Promise<void> {
        const workerId = BackendCluster.getWorkerId();

        await Promise.all(this._items.map(async(item) => {
            try {
                const data = await Promise.resolve(item.serialize());
                const key = ClusterRegistry.buildKey(item.getNamespace(), workerId);
                await this._store.set(key, data, this._ttlMs);
            } catch (err) {
                Logger.getLogger().error?.(
                    `ClusterRegistry::tick: serialize/set failed for namespace '${item.getNamespace()}'`,
                    err
                );
            }
        }));
    }

}