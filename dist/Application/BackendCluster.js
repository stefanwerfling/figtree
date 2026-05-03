import cluster from 'cluster';
import * as os from 'os';
const DEFAULT_BACKOFF_MS = [0, 1000, 5000, 15_000, 30_000];
const DEFAULT_MAX_PER_WINDOW = 5;
const DEFAULT_WINDOW_MS = 60_000;
export class BackendCluster {
    _workers;
    _appFactory;
    _shutdownTimeoutMs;
    _shutdownSignals;
    _backoffMs;
    _maxPerWindow;
    _windowMs;
    _crashTimestamps = [];
    _shuttingDown = false;
    constructor(options) {
        this._workers = options.workers ?? os.cpus().length;
        this._appFactory = options.appFactory;
        this._shutdownTimeoutMs = options.shutdownTimeoutMs ?? 15_000;
        this._shutdownSignals = options.shutdownSignals ?? ['SIGTERM', 'SIGINT'];
        this._backoffMs = options.respawn?.backoffMs ?? DEFAULT_BACKOFF_MS;
        this._maxPerWindow = options.respawn?.maxPerWindow ?? DEFAULT_MAX_PER_WINDOW;
        this._windowMs = options.respawn?.windowMs ?? DEFAULT_WINDOW_MS;
    }
    async start() {
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
                console.log(`Worker ${worker.process.pid} died (code=${code}, signal=${signal}).`);
                this._handleCrash();
            });
            for (const sig of this._shutdownSignals) {
                process.on(sig, () => {
                    this._shutdown(sig).catch((err) => {
                        console.error('BackendCluster::shutdown error:', err);
                    });
                });
            }
        }
        else {
            console.log(`Worker ${process.pid} starting...`);
            const app = this._appFactory();
            await app.start();
        }
    }
    _handleCrash() {
        const now = Date.now();
        this._crashTimestamps = this._crashTimestamps.filter((t) => now - t < this._windowMs);
        this._crashTimestamps.push(now);
        const recentCrashes = this._crashTimestamps.length;
        if (recentCrashes > this._maxPerWindow) {
            console.error(`BackendCluster: circuit breaker tripped — ${recentCrashes} crashes within ${this._windowMs}ms. Halting cluster.`);
            this._shuttingDown = true;
            process.exit(1);
        }
        const backoffIndex = Math.min(recentCrashes - 1, this._backoffMs.length - 1);
        const delay = this._backoffMs[backoffIndex];
        console.log(`BackendCluster: respawning worker in ${delay}ms (crash ${recentCrashes}/${this._maxPerWindow} in window).`);
        setTimeout(() => {
            if (this._shuttingDown) {
                return;
            }
            cluster.fork();
        }, delay);
    }
    async _shutdown(signal) {
        if (this._shuttingDown) {
            return;
        }
        this._shuttingDown = true;
        console.log(`Master ${process.pid} received ${signal}, shutting down workers...`);
        const workers = Object.values(cluster.workers ?? {}).filter((w) => w !== undefined && !w.isDead());
        const exits = workers.map((w) => new Promise((resolve) => {
            w.once('exit', () => resolve());
            try {
                w.process.kill('SIGTERM');
            }
            catch {
                resolve();
            }
        }));
        const timeout = new Promise((resolve) => {
            setTimeout(() => {
                for (const w of workers) {
                    if (!w.isDead()) {
                        console.warn(`Worker ${w.process.pid} did not exit within ${this._shutdownTimeoutMs}ms, killing.`);
                        try {
                            w.process.kill('SIGKILL');
                        }
                        catch {
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
//# sourceMappingURL=BackendCluster.js.map