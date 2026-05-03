import {Logger} from '../Logger/Logger.js';
import {SharedStore} from '../SharedStore/SharedStore.js';
import {ClusterLease} from './ClusterLease.js';

/**
 * Callback signature for leadership lifecycle events. Sync or async.
 */
export type ClusterLeaderCallback = () => void | Promise<void>;

/**
 * Options for `ClusterLeader`.
 */
export type ClusterLeaderOptions = {
    /** Lease key — must be unique cluster-wide for the role being elected. */
    name: string;
    /** Lease TTL in ms. Default 15_000 (15s). */
    ttlMs?: number;
    /**
     * Renew interval in ms. Should be well below `ttlMs` (typically `ttlMs / 3`)
     * so a missed renewal does not lose the lease. Default `ttlMs / 3`.
     */
    renewMs?: number;
    /**
     * Retry interval in ms when we are NOT the leader and want to try acquiring.
     * Default 5_000 (5s).
     */
    retryMs?: number;
};

/**
 * `ClusterLeader` — exactly-one-leader-cluster-wide abstraction built on top
 * of a `ClusterLease`.
 *
 * Workers subscribe to lifecycle events:
 * - `onLeaderElected` fires when this worker becomes the leader.
 * - `onLeaderLost` fires when this worker stops being the leader (lease expired
 *   between renewals or `stop()` was called).
 *
 * Multiple host scaling: when used with `RedisSharedStore` the lease is shared
 * across hosts, so exactly one process across the entire cluster will be the
 * leader for a given `name`.
 *
 * @example
 *   const leader = new ClusterLeader(store, { name: 'cron-master' });
 *
 *   leader.onLeaderElected(() => startCronJobs());
 *   leader.onLeaderLost(() => stopCronJobs());
 *
 *   await leader.start();
 *   // ... at shutdown
 *   await leader.stop();
 */
export class ClusterLeader {

    private static readonly _DEFAULT_TTL_MS = 15_000;
    private static readonly _DEFAULT_RETRY_MS = 5_000;

    private readonly _lease: ClusterLease;
    private readonly _renewMs: number;
    private readonly _retryMs: number;

    private _running = false;
    private _timer: NodeJS.Timeout | null = null;

    private readonly _onElected: ClusterLeaderCallback[] = [];
    private readonly _onLost: ClusterLeaderCallback[] = [];

    /**
     * Constructor.
     * @param {SharedStore} store
     * @param {ClusterLeaderOptions} options
     */
    public constructor(store: SharedStore, options: ClusterLeaderOptions) {
        const ttlMs = options.ttlMs ?? ClusterLeader._DEFAULT_TTL_MS;
        this._lease = store.createLease(options.name, { ttlMs: ttlMs });
        this._renewMs = options.renewMs ?? Math.floor(ttlMs / 3);
        this._retryMs = options.retryMs ?? ClusterLeader._DEFAULT_RETRY_MS;
    }

    /**
     * Subscribe to "this worker just became the leader".
     * @param {ClusterLeaderCallback} callback
     */
    public onLeaderElected(callback: ClusterLeaderCallback): void {
        this._onElected.push(callback);
    }

    /**
     * Subscribe to "this worker just lost the leadership".
     * @param {ClusterLeaderCallback} callback
     */
    public onLeaderLost(callback: ClusterLeaderCallback): void {
        this._onLost.push(callback);
    }

    /**
     * Whether this worker currently holds the leadership.
     * @return {boolean}
     */
    public isLeader(): boolean {
        return this._lease.isHolder();
    }

    /**
     * Start the election loop. Returns immediately — leadership lifecycle is
     * managed in the background and reported via the `onLeaderElected` /
     * `onLeaderLost` callbacks.
     */
    public async start(): Promise<void> {
        if (this._running) {
            return;
        }

        this._running = true;
        await this._tick();
    }

    /**
     * Stop the election loop. If this worker is the leader, releases the lease
     * (and fires `onLeaderLost`). Otherwise just clears the retry timer.
     */
    public async stop(): Promise<void> {
        if (!this._running) {
            return;
        }

        this._running = false;

        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }

        if (this._lease.isHolder()) {
            try {
                await this._lease.release();
            } catch (err) {
                Logger.getLogger().warn?.('ClusterLeader::stop: lease release failed', err);
            }

            await this._fireLost();
        }
    }

    /**
     * Run one election tick: either acquire (if not leader), renew (if leader),
     * or retry-acquire (if just lost). Schedules the next tick.
     * @private
     */
    private async _tick(): Promise<void> {
        if (!this._running) {
            return;
        }

        try {
            if (this._lease.isHolder()) {
                const renewed = await this._lease.renew();

                if (renewed) {
                    this._scheduleNext(this._renewMs);
                    return;
                }

                // Lost it — fire callback and try again on retry interval.
                await this._fireLost();
                this._scheduleNext(this._retryMs);
                return;
            }

            const acquired = await this._lease.acquire();

            if (acquired) {
                await this._fireElected();
                this._scheduleNext(this._renewMs);
                return;
            }

            this._scheduleNext(this._retryMs);
        } catch (err) {
            Logger.getLogger().error?.('ClusterLeader::tick error', err);
            this._scheduleNext(this._retryMs);
        }
    }

    private _scheduleNext(delayMs: number): void {
        if (!this._running) {
            return;
        }

        this._timer = setTimeout(() => {
            this._tick().catch((err) => {
                Logger.getLogger().error?.('ClusterLeader::scheduled tick error', err);
            });
        }, delayMs);
    }

    private async _fireElected(): Promise<void> {
        // sequential by design — callbacks may carry ordering assumptions
        /* eslint-disable no-await-in-loop */
        for (const cb of this._onElected) {
            try {
                await Promise.resolve(cb());
            } catch (err) {
                Logger.getLogger().error?.('ClusterLeader::onLeaderElected callback error', err);
            }
        }
        /* eslint-enable no-await-in-loop */
    }

    private async _fireLost(): Promise<void> {
        // sequential by design — callbacks may carry ordering assumptions
        /* eslint-disable no-await-in-loop */
        for (const cb of this._onLost) {
            try {
                await Promise.resolve(cb());
            } catch (err) {
                Logger.getLogger().error?.('ClusterLeader::onLeaderLost callback error', err);
            }
        }
        /* eslint-enable no-await-in-loop */
    }

}