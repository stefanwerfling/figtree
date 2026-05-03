import cluster, {Worker} from 'cluster';
import * as os from 'os';
import {BackendApp} from './BackendApp.js';

/**
 * Backend cluster app facotry
 */
export type BackendClusterAppFactory = () => BackendApp<any, any>;

/**
 * Mapping of role name to worker count.
 *
 * @example { http: 4, cron: 1 }   // 4 HTTP workers + 1 cron worker
 */
export type BackendClusterRoles = Record<string, number>;

/**
 * Respawn behavior for crashed workers.
 */
export type BackendClusterRespawnOptions = {
    /**
     * Backoff sequence in ms; index = number of recent crashes - 1.
     * The last value is reused once the index exceeds the array length.
     * Default: [0, 1000, 5000, 15000, 30000]
     * (1st crash → instant, 2nd → 1s, 3rd → 5s, ...).
     */
    backoffMs?: number[];
    /**
     * If more than maxPerWindow crashes happen within windowMs,
     * halt the cluster (process.exit(1)). Default 5.
     */
    maxPerWindow?: number;
    /** Window for the circuit breaker in ms. Default 60_000 (60s). */
    windowMs?: number;
};

/**
 * Backend cluster options
 */
export type BackendClusterOptions = {
    /**
     * Number of workers when no roles are configured. Defaults to os.cpus().length.
     * Ignored when `roles` is set (the role counts determine the worker count).
     */
    workers?: number;
    appFactory: BackendClusterAppFactory;
    /**
     * Time to wait for workers to exit gracefully before SIGKILL (ms).
     * Should be larger than the worker's own shutdown timeout. Default 15000.
     */
    shutdownTimeoutMs?: number;
    /**
     * Signals that trigger a graceful cluster shutdown. Default ['SIGTERM', 'SIGINT'].
     */
    shutdownSignals?: NodeJS.Signals[];
    /**
     * Respawn / circuit-breaker behavior for crashed workers.
     */
    respawn?: BackendClusterRespawnOptions;
    /**
     * Worker roles. Each key is a role name, the value is the number of workers
     * for that role. The total worker count equals the sum of all values.
     * The role is propagated to each worker via the `WORKER_ROLE` env variable
     * and accessible via `BackendCluster.getWorkerRole()`.
     */
    roles?: BackendClusterRoles;
};

const DEFAULT_BACKOFF_MS = [0, 1000, 5000, 15_000, 30_000];
const DEFAULT_MAX_PER_WINDOW = 5;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_ROLE = 'default';

/**
 * BackendCluster
 */
export class BackendCluster {

    /**
     * Returns a unique identifier for the current process within the cluster.
     * Format: `<hostname>:<pid>`. Stable across single-process and clustered modes.
     * @return {string}
     */
    public static getWorkerId(): string {
        return `${os.hostname()}:${process.pid}`;
    }

    /**
     * Returns the role assigned to the current worker via `WORKER_ROLE` env.
     * Returns `'default'` when not running inside a role-based cluster.
     * @return {string}
     */
    public static getWorkerRole(): string {
        return process.env.WORKER_ROLE ?? DEFAULT_ROLE;
    }

    /**
     * Flat list of role names — one entry per worker. `null` means "no role".
     * @private
     */
    private readonly _roleAssignments: (string | null)[];

    /**
     * app facotry
     * @private
     */
    private readonly _appFactory: BackendClusterAppFactory;

    /**
     * shutdown grace period for workers in ms
     * @private
     */
    private readonly _shutdownTimeoutMs: number;

    /**
     * signals that trigger a graceful shutdown
     * @private
     */
    private readonly _shutdownSignals: NodeJS.Signals[];

    /**
     * respawn backoff schedule
     * @private
     */
    private readonly _backoffMs: number[];

    /**
     * circuit breaker: max crashes within window
     * @private
     */
    private readonly _maxPerWindow: number;

    /**
     * circuit breaker window in ms
     * @private
     */
    private readonly _windowMs: number;

    /**
     * Cluster-wide crash timestamps within the current window.
     * @private
     */
    private _crashTimestamps: number[] = [];

    /**
     * worker.id → role (or null).
     * @private
     */
    private _workerRoles: Map<number, string | null> = new Map();

    /**
     * True once a shutdown signal has been received — prevents respawn.
     * @private
     */
    private _shuttingDown = false;

    /**
     * constructor
     * @param {BackendClusterOptions} options
     */
    public constructor(options: BackendClusterOptions) {
        this._appFactory = options.appFactory;
        this._shutdownTimeoutMs = options.shutdownTimeoutMs ?? 15_000;
        this._shutdownSignals = options.shutdownSignals ?? ['SIGTERM', 'SIGINT'];
        this._backoffMs = options.respawn?.backoffMs ?? DEFAULT_BACKOFF_MS;
        this._maxPerWindow = options.respawn?.maxPerWindow ?? DEFAULT_MAX_PER_WINDOW;
        this._windowMs = options.respawn?.windowMs ?? DEFAULT_WINDOW_MS;

        if (options.roles) {
            this._roleAssignments = BackendCluster._flattenRoles(options.roles);
        } else {
            const count = options.workers ?? os.cpus().length;
            this._roleAssignments = new Array(count).fill(null);
        }
    }

    /**
     * Flatten a role map into a per-worker assignment list.
     * @param {BackendClusterRoles} roles
     * @return {string[]}
     * @private
     */
    private static _flattenRoles(roles: BackendClusterRoles): string[] {
        const list: string[] = [];

        for (const [role, count] of Object.entries(roles)) {
            for (let i = 0; i < count; i++) {
                list.push(role);
            }
        }

        if (list.length === 0) {
            throw new Error('BackendCluster: roles option contains no workers (all counts are 0)');
        }

        return list;
    }

    /**
     * Start
     */
    public async start(): Promise<void> {
        if (cluster.isPrimary) {
            console.log(`Master ${process.pid} is running`);

            for (const role of this._roleAssignments) {
                this._forkWithRole(role);
            }

            cluster.on('exit', (worker, code, signal) => {
                if (this._shuttingDown) {
                    console.log(`Worker ${worker.process.pid} exited during shutdown (code=${code}, signal=${signal}).`);
                    return;
                }

                const role = this._workerRoles.get(worker.id) ?? null;
                this._workerRoles.delete(worker.id);

                console.log(
                    `Worker ${worker.process.pid} (role=${role ?? DEFAULT_ROLE}) died (code=${code}, signal=${signal}).`
                );
                this._handleCrash(role);
            });

            for (const sig of this._shutdownSignals) {
                process.on(sig, () => {
                    this._shutdown(sig).catch((err) => {
                        console.error('BackendCluster::shutdown error:', err);
                    });
                });
            }
        } else {
            console.log(`Worker ${process.pid} (role=${BackendCluster.getWorkerRole()}) starting...`);
            const app = this._appFactory();
            await app.start();
        }
    }

    /**
     * Fork a worker with the given role. The role is exposed to the worker
     * via the `WORKER_ROLE` env variable.
     * @param {string|null} role
     * @return {Worker}
     * @private
     */
    private _forkWithRole(role: string | null): Worker {
        const env = role === null ? {} : { WORKER_ROLE: role };
        const worker = cluster.fork(env);
        this._workerRoles.set(worker.id, role);

        return worker;
    }

    /**
     * Record the crash, check the circuit breaker, otherwise schedule a backoff respawn
     * with the same role as the dead worker.
     * @param {string|null} role
     * @private
     */
    private _handleCrash(role: string | null): void {
        const now = Date.now();
        this._crashTimestamps = this._crashTimestamps.filter((t) => now - t < this._windowMs);
        this._crashTimestamps.push(now);

        const recentCrashes = this._crashTimestamps.length;

        if (recentCrashes > this._maxPerWindow) {
            console.error(
                `BackendCluster: circuit breaker tripped — ${recentCrashes} crashes within ${this._windowMs}ms. Halting cluster.`
            );
            this._shuttingDown = true;
            process.exit(1);
        }

        const backoffIndex = Math.min(recentCrashes - 1, this._backoffMs.length - 1);
        const delay = this._backoffMs[backoffIndex];

        console.log(
            `BackendCluster: respawning ${role ?? DEFAULT_ROLE} worker in ${delay}ms (crash ${recentCrashes}/${this._maxPerWindow} in window).`
        );

        setTimeout(() => {
            if (this._shuttingDown) {
                return;
            }

            this._forkWithRole(role);
        }, delay);
    }

    /**
     * Graceful shutdown: stop respawning, signal all workers to stop,
     * wait up to shutdownTimeoutMs, then SIGKILL holdouts.
     * @param {NodeJS.Signals} signal
     * @private
     */
    private async _shutdown(signal: NodeJS.Signals): Promise<void> {
        if (this._shuttingDown) {
            return;
        }

        this._shuttingDown = true;
        console.log(`Master ${process.pid} received ${signal}, shutting down workers...`);

        const workers = Object.values(cluster.workers ?? {}).filter(
            (w): w is Worker => w !== undefined && !w.isDead()
        );

        const exits = workers.map((w) => new Promise<void>((resolve) => {
            w.once('exit', () => resolve());

            try {
                w.process.kill('SIGTERM');
            } catch {
                resolve();
            }
        }));

        const timeout = new Promise<void>((resolve) => {
            setTimeout(() => {
                for (const w of workers) {
                    if (!w.isDead()) {
                        console.warn(`Worker ${w.process.pid} did not exit within ${this._shutdownTimeoutMs}ms, killing.`);

                        try {
                            w.process.kill('SIGKILL');
                        } catch {
                            // ignore
                        }
                    }
                }

                resolve();
            }, this._shutdownTimeoutMs);
        });

        await Promise.race([Promise.all(exits), timeout]);

        console.log(`Master ${process.pid} shutdown complete.`);
        process.exit(0);
    }

}