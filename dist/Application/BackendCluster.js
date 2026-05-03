import cluster from 'cluster';
import * as os from 'os';
const DEFAULT_BACKOFF_MS = [0, 1000, 5000, 15_000, 30_000];
const DEFAULT_MAX_PER_WINDOW = 5;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_ROLE = 'default';
export class BackendCluster {
    static getWorkerId() {
        return `${os.hostname()}:${process.pid}`;
    }
    static getWorkerRole() {
        return process.env.WORKER_ROLE ?? DEFAULT_ROLE;
    }
    _roleAssignments;
    _appFactory;
    _shutdownTimeoutMs;
    _shutdownSignals;
    _backoffMs;
    _maxPerWindow;
    _windowMs;
    _crashTimestamps = [];
    _workerRoles = new Map();
    _shuttingDown = false;
    constructor(options) {
        this._appFactory = options.appFactory;
        this._shutdownTimeoutMs = options.shutdownTimeoutMs ?? 15_000;
        this._shutdownSignals = options.shutdownSignals ?? ['SIGTERM', 'SIGINT'];
        this._backoffMs = options.respawn?.backoffMs ?? DEFAULT_BACKOFF_MS;
        this._maxPerWindow = options.respawn?.maxPerWindow ?? DEFAULT_MAX_PER_WINDOW;
        this._windowMs = options.respawn?.windowMs ?? DEFAULT_WINDOW_MS;
        if (options.roles) {
            this._roleAssignments = BackendCluster._flattenRoles(options.roles);
        }
        else {
            const count = options.workers ?? os.cpus().length;
            this._roleAssignments = new Array(count).fill(null);
        }
    }
    static _flattenRoles(roles) {
        const list = [];
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
    async start() {
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
                console.log(`Worker ${worker.process.pid} (role=${role ?? DEFAULT_ROLE}) died (code=${code}, signal=${signal}).`);
                this._handleCrash(role);
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
            console.log(`Worker ${process.pid} (role=${BackendCluster.getWorkerRole()}) starting...`);
            const app = this._appFactory();
            await app.start();
        }
    }
    _forkWithRole(role) {
        const env = role === null ? {} : { WORKER_ROLE: role };
        const worker = cluster.fork(env);
        this._workerRoles.set(worker.id, role);
        return worker;
    }
    _handleCrash(role) {
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
        console.log(`BackendCluster: respawning ${role ?? DEFAULT_ROLE} worker in ${delay}ms (crash ${recentCrashes}/${this._maxPerWindow} in window).`);
        setTimeout(() => {
            if (this._shuttingDown) {
                return;
            }
            this._forkWithRole(role);
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