import { APlugin } from './APlugin.js';
import { APluginEvent } from './APluginEvent.js';
import { PluginInformation } from './PluginInformation.js';
export type PluginManagerOptions = {
    checkDistHash?: boolean;
    appPath?: string;
};
export declare class PluginManager {
    protected static _instance: PluginManager | null;
    protected _appPath: string;
    protected _checkDistHash: boolean;
    protected _serviceName: string;
    protected _plugins: APlugin[];
    protected _events: Map<string, APluginEvent[]>;
    static getInstance(): PluginManager;
    static hasInstance(): boolean;
    constructor(serviceName: string, options?: PluginManagerOptions);
    getServiceName(): string;
    start(): Promise<void>;
    stop(): Promise<void>;
    scan(): Promise<PluginInformation[]>;
    load(plugin: PluginInformation): Promise<boolean>;
    getPlugins(): APlugin[];
    getPlugin(name: string): APlugin | null;
    registerEvents(listner: APluginEvent, plugin: APlugin): void;
    getAllEvents<T extends APluginEvent>(aClass: Function): T[];
}
