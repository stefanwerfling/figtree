import cluster from 'cluster';
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
     * constructor
     * @param {BackendClusterOptions} options
     */
    public constructor(options: BackendClusterOptions) {
        this._workers = options.workers ?? os.cpus().length;
        this._appFactory = options.appFactory;
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
                console.log(`Worker ${worker.process.pid} died. Respawning...`);
                cluster.fork();
            });
        } else {
            console.log(`Worker ${process.pid} starting...`);
            const app = this._appFactory();
            await app.start();
        }
    }
}