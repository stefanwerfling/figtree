import cluster from 'cluster';
import * as os from 'os';
export class BackendCluster {
    _workers;
    _appFactory;
    _shutdownTimeoutMs;
    _shutdownSignals;
    _shuttingDown = false;
    constructor(options) {
        this._workers = options.workers ?? os.cpus().length;
        this._appFactory = options.appFactory;
        this._shutdownTimeoutMs = options.shutdownTimeoutMs ?? 15_000;
        this._shutdownSignals = options.shutdownSignals ?? ['SIGTERM', 'SIGINT'];
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
        }
        else {
            console.log(`Worker ${process.pid} starting...`);
            const app = this._appFactory();
            await app.start();
        }
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