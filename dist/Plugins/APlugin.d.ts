import { PluginDefinition } from 'figtree-schemas';
import { PluginManager } from './PluginManager.js';
export declare abstract class APlugin {
    protected _info: PluginDefinition;
    private readonly _pluginManager;
    constructor(info: PluginDefinition, pm: PluginManager);
    protected getPluginManager(): PluginManager;
    abstract getName(): string;
    abstract onEnable(): Promise<boolean>;
    abstract onDisable(): Promise<boolean>;
}
