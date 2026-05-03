import { BackendApp } from './BackendApp.js';
export type BackendClusterAppFactory = () => BackendApp<any, any>;
export type BackendClusterRespawnOptions = {
    backoffMs?: number[];
    maxPerWindow?: number;
    windowMs?: number;
};
export type BackendClusterOptions = {
    workers?: number;
    appFactory: BackendClusterAppFactory;
    shutdownTimeoutMs?: number;
    shutdownSignals?: NodeJS.Signals[];
    respawn?: BackendClusterRespawnOptions;
};
export declare class BackendCluster {
    private readonly _workers;
    private readonly _appFactory;
    private readonly _shutdownTimeoutMs;
    private readonly _shutdownSignals;
    private readonly _backoffMs;
    private readonly _maxPerWindow;
    private readonly _windowMs;
    private _crashTimestamps;
    private _shuttingDown;
    constructor(options: BackendClusterOptions);
    start(): Promise<void>;
    private _handleCrash;
    private _shutdown;
}
