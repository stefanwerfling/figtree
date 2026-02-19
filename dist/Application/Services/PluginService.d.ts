import { ServiceImportance } from 'figtree-schemas';
import { PluginManager, PluginManagerOptions } from '../../Plugins/PluginManager.js';
import { ServiceAbstract } from '../../Service/ServiceAbstract.js';
export declare class PluginService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    protected _pluginManager: PluginManager;
    constructor(appName: string, serviceName?: string, serviceDependencies?: string[], options?: PluginManagerOptions);
    getPluginManager(): PluginManager;
    start(): Promise<void>;
    stop(): Promise<void>;
}
