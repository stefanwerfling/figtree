import cluster from 'cluster';
import * as os from 'os';
export class BackendCluster {
    _workers;
    _appFactory;
    constructor(options) {
        this._workers = options.workers ?? os.cpus().length;
        this._appFactory = options.appFactory;
    }
    async start() {
        if (cluster.isPrimary) {
            console.log(`Master ${process.pid} is running`);
            for (let i = 0; i < this._workers; i++) {
                cluster.fork();
            }
            cluster.on('exit', (worker, code, signal) => {
                console.log(`Worker ${worker.process.pid} died. Respawning...`);
                cluster.fork();
            });
        }
        else {
            console.log(`Worker ${process.pid} starting...`);
            const app = this._appFactory();
            await app.start();
        }
    }
}
//# sourceMappingURL=BackendCluster.js.map