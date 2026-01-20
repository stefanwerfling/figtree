import { ConfigOptions, DefaultArgs } from 'figtree-schemas';
import { Schema } from 'vts';
import { ConfigBackend } from '../Config/ConfigBackend.js';
import { ServiceManager } from '../Service/ServiceManager.js';
export declare abstract class BackendApp<A extends DefaultArgs, C extends ConfigOptions> {
    private static _instances;
    static getInstance(name: string): BackendApp<any, any> | null;
    protected _appName: string;
    protected _args: A | null;
    protected _serviceManager: ServiceManager;
    protected constructor(name?: string);
    protected _getArgSchema(): Schema<A> | null;
    protected _getConfigInstance(): ConfigBackend;
    protected _loadConfig(): Promise<boolean>;
    protected _initLogger(): void;
    protected _initServices(): Promise<void>;
    start(): Promise<void>;
    getServiceManager(): ServiceManager;
}
