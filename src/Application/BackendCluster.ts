import cluster, {Worker} from 'cluster';
import * as os from 'os';
import {BackendApp} from './BackendApp.js';

/**
 * Backend cluster app facotry
 */
export type BackendClusterAppFactory = () => BackendApp<any, any>;

/**
 * Backend cluster options
 */
export type BackendClusterOptions = {
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
};

/**
 * BackendCluster
 */
export class BackendCluster {

    /**
     * workers
     * @private
     */
    private readonly _workers: number;

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
     * True once a shutdown signal has been received — prevents respawn.
     * @private
     */
    private _shuttingDown = false;

    /**
     * constructor
     * @param {BackendClusterOptions} options
     */
    public constructor(options: BackendClusterOptions) {
        this._workers = options.workers ?? os.cpus().length;
        this._appFactory = options.appFactory;
        this._shutdownTimeoutMs = options.shutdownTimeoutMs ?? 15_000;
        this._shutdownSignals = options.shutdownSignals ?? ['SIGTERM', 'SIGINT'];
    }

    /**
     * Start
     */
    public async start(): Promise<void> {
        if (cluster.isPrimary) {
            console.log(`Master ${process.pid} is running`);

            for (let i = 0; i < this._workers; i++) {
                cluster.fork();
            }

            cluster.on('exit', (worker, code, signal) => {
                if (this._shuttingDown) {
                    console.log(`Worker ${worker.process.pid} exited during shutdown (code=${code}, signal=${signal}).`);
                    return;
                }

                console.log(`Worker ${worker.process.pid} died (code=${code}, signal=${signal}). Respawning...`);
                cluster.fork();
            });

            for (const sig of this._shutdownSignals) {
                process.on(sig, () => {
                    this._shutdown(sig).catch((err) => {
                        console.error('BackendCluster::shutdown error:', err);
                    });
                });
            }
        } else {
            console.log(`Worker ${process.pid} starting...`);
            const app = this._appFactory();
            await app.start();
        }
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