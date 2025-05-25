import { PluginManager } from '../../Plugins/PluginManager.js';
import { ServiceAbstract, ServiceImportance } from '../../Service/ServiceAbstract.js';
export declare class PluginService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    protected _pluginManager: PluginManager;
    constructor(appName: string, serviceName?: string, serviceDependencies?: string[]);
    getPluginManager(): PluginManager;
    start(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
}
