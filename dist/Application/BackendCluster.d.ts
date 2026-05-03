import { BackendApp } from './BackendApp.js';
export type BackendClusterAppFactory = () => BackendApp<any, any>;
export type BackendClusterOptions = {
    workers?: number;
    appFactory: BackendClusterAppFactory;
    shutdownTimeoutMs?: number;
    shutdownSignals?: NodeJS.Signals[];
};
export declare class BackendCluster {
    private readonly _workers;
    private readonly _appFactory;
    private readonly _shutdownTimeoutMs;
    private readonly _shutdownSignals;
    private _shuttingDown;
    constructor(options: BackendClusterOptions);
    start(): Promise<void>;
    private _shutdown;
}
