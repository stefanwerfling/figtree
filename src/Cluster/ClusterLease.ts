/**
 * Options for a `ClusterLease`.
 */
export type ClusterLeaseOptions = {
    /**
     * Lease time-to-live in milliseconds. The lease automatically expires after
     * this time unless renewed. Default: 15_000 (15s).
     */
    ttlMs?: number;
};

/**
 * Distributed lease primitive. Exactly one holder cluster-wide at any time
 * (per `name`), as long as the holder renews its lease before `ttlMs` elapses.
 *
 * Two implementations exist: `IPCLease` (single-host, master-process atomic
 * map) and `RedisLease` (multi-host, atomic via Redis SET NX + tiny Lua scripts
 * for renew / release). Use `SharedStore.createLease(name, options)` to build
 * the right one for your store.
 */
export abstract class ClusterLease {

    /**
     * Try to acquire the lease. Returns `true` if it was acquired (or is still
     * held by us), `false` if another holder is currently active.
     */
    public abstract acquire(): Promise<boolean>;

    /**
     * Renew the lease — only succeeds if we are still the holder. Returns
     * `false` when we have lost it (e.g. our process was paused long enough
     * for the TTL to elapse and another worker acquired in the meantime).
     */
    public abstract renew(): Promise<boolean>;

    /**
     * Release the lease — only deletes the underlying entry if we are still
     * the holder. Returns `true` if we released, `false` if we were no longer
     * the holder.
     */
    public abstract release(): Promise<boolean>;

    /**
     * Whether this instance currently believes it holds the lease.
     * Local view only — does not contact the store.
     */
    public abstract isHolder(): boolean;

    /**
     * Lease name (the key used in the underlying store).
     */
    public abstract getName(): string;

}