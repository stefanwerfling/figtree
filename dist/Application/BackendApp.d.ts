import { Schema } from 'vts';
import { Config } from '../Config/Config.js';
import { DefaultArgs } from '../Schemas/Args/DefaultArgs.js';
import { ConfigOptions } from '../Schemas/Config/ConfigOptions.js';
import { ServiceManager } from '../Service/ServiceManager.js';
export declare abstract class BackendApp<A extends DefaultArgs, C extends ConfigOptions> {
    private static _instances;
    static getInstance(name: string): BackendApp<any, any> | null;
    protected _appName: string;
    protected _args: A | null;
    protected _serviceManager: ServiceManager;
    protected constructor(name?: string);
    protected _getArgSchema(): Schema<A> | null;
    protected _getConfigInstance(): Config<C>;
    protected _loadConfig(): Promise<boolean>;
    protected _initLogger(): void;
    protected _initServices(): Promise<void>;
    start(): Promise<void>;
    getServiceManager(): ServiceManager;
}
