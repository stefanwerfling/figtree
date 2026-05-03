import { BackendApp } from './BackendApp.js';
export type BackendClusterAppFactory = () => BackendApp<any, any>;
export type BackendClusterRoles = Record<string, number>;
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
    roles?: BackendClusterRoles;
};
export declare class BackendCluster {
    static getWorkerId(): string;
    static getWorkerRole(): string;
    private readonly _roleAssignments;
    private readonly _appFactory;
    private readonly _shutdownTimeoutMs;
    private readonly _shutdownSignals;
    private readonly _backoffMs;
    private readonly _maxPerWindow;
    private readonly _windowMs;
    private _crashTimestamps;
    private _workerRoles;
    private _shuttingDown;
    constructor(options: BackendClusterOptions);
    private static _flattenRoles;
    start(): Promise<void>;
    private _forkWithRole;
    private _handleCrash;
    private _shutdown;
}
