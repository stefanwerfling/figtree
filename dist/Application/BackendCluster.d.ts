import { BackendApp } from './BackendApp.js';
export type BackendClusterAppFactory = () => BackendApp<any, any>;
export type BackendClusterOptions = {
    workers?: number;
    appFactory: BackendClusterAppFactory;
};
export declare class BackendCluster {
    private readonly _workers;
    private readonly _appFactory;
    constructor(options: BackendClusterOptions);
    start(): Promise<void>;
}
