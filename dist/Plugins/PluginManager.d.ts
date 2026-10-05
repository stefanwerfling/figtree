import { APlugin } from './APlugin.js';
import { APluginEvent } from './APluginEvent.js';
import { PluginInformation } from './PluginInformation.js';
export type PluginManagerOptions = {
    checkDistHash?: boolean;
    appPath?: string;
    pluginKey?: string;
};
export declare class PluginManager {
    protected static _instance: PluginManager | null;
    protected _appPath: string;
    protected _checkDistHash: boolean;
    protected _pluginKey: string;
    protected _serviceName: string;
    protected _plugins: APlugin[];
    protected _loaded: Map<string, APlugin>;
    protected _informations: PluginInformation[];
    protected _events: Map<string, APluginEvent[]>;
    static getInstance(): PluginManager;
    static hasInstance(): boolean;
    constructor(serviceName: string, options?: PluginManagerOptions);
    getServiceName(): string;
    start(): Promise<void>;
    stop(): Promise<void>;
    scan(): Promise<PluginInformation[]>;
    private _scanModule;
    load(plugin: PluginInformation): Promise<boolean>;
    getPlugins(): APlugin[];
    getPlugin(name: string): APlugin | null;
    getInformations(): PluginInformation[];
    getLoadedPlugin(name: string): APlugin | null;
    enablePlugin(name: string): Promise<boolean>;
    disablePlugin(name: string): Promise<boolean>;
    registerEvents(listner: APluginEvent, plugin: APlugin): void;
    getAllEvents<T extends APluginEvent>(aClass: abstract new (...args: any[]) => T): T[];
}
