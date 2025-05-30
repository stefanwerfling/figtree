import {Ets} from 'ets';
import {SchemaErrors} from 'vts';
import {MerkleTreeRootHash} from '../Crypto/MerkleTreeRootHash.js';
import {Logger} from '../Logger/Logger.js';
import {SchemaPluginDefinition} from '../Schemas/Plugin/PluginDefinition.js';
import {DirHelper} from '../Utils/DirHelper.js';
import {FileHelper} from '../Utils/FileHelper.js';
import {APlugin} from './APlugin.js';
import {APluginEvent} from './APluginEvent.js';
import path from 'path';
import {PluginInformation} from './PluginInformation.js';

/**
 * Plugin manager options
 */
export type PluginManagerOptions = {
    checkDistHash?: boolean;
    // Path-to-modules directory
    appPath?: string;
};

/**
 * Plugin manager controll the plugin loading and event registering.
 */
export class PluginManager {

    /**
     * plugin manager instance
     * @protected
     */
    protected static _instance: PluginManager|null = null;

    /**
     * app path for node_modules
     * @protected
     */
    protected _appPath: string;

    /**
     * check the dist hash
     * @protected
     */
    protected _checkDistHash: boolean = false;

    /**
     * Service name from service instance (name of the system in which the plugin works).
     * @member {string}
     */
    protected _serviceName: string;

    /**
     * Plugin loading list.
     * @member {APlugin[]}
     */
    protected _plugins: APlugin[] = [];

    /**
     * events
     * @member {Map<string, APluginEvent[]>}
     */
    protected _events: Map<string, APluginEvent[]> = new Map<string, APluginEvent[]>();

    /**
     * Retrung a plugin manager instance or throw error by wrong initalition.
     * @returns {PluginManager}
     */
    public static getInstance(): PluginManager {
        if (PluginManager._instance === null) {
            throw new Error('PluginManager::getInstance: instance is empty, please init first plugin manager!');
        }

        return PluginManager._instance;
    }

    /**
     * Has an instance of plugin manager
     * @return {boolean}
     */
    public static hasInstance(): boolean {
        return PluginManager._instance === null;
    }

    /**
     * Constructor
     * @param {string} serviceName - Service name, name who starts the plugin manager.
     * @param {string} options - options for plugin manager
     */
    public constructor(serviceName: string, options: PluginManagerOptions = {}) {
        this._appPath = path.join(path.resolve());

        if (options.appPath) {
            this._appPath = options.appPath;
        }

        if (options.checkDistHash) {
            this._checkDistHash = true;
        }

        this._serviceName = serviceName;

        PluginManager._instance = this;
    }

    /**
     * Return the service name
     * @returns {string}
     */
    public getServiceName(): string {
        return this._serviceName;
    }

    /**
     * Start all loaded plugins.
     */
    public async start(): Promise<void> {
        const pluginInfos = await this.scan();

        for await (const pluginInfo of pluginInfos) {
            Logger.getLogger().silly(
                'PluginManager::start: found plugin: %s (%s)',
                pluginInfo.definition.name,
                pluginInfo.definition.version
            );

            await this.load(pluginInfo);
        }
    }

    public async stop(): Promise<void> {
        for (const plugin of this._plugins) {
            await plugin.onDisable();
        }

        this._events.clear();
        this._plugins = [];
    }

    /**
     * Scan all modules for plugin information.
     * @returns {PluginInformation[]}
     */
    public async scan(): Promise<PluginInformation[]> {
        let nodeModulesPath = path.join(this._appPath, 'node_modules');

        if (!await DirHelper.directoryExist(nodeModulesPath)) {
            nodeModulesPath = path.join(this._appPath, 'node_modules', this._serviceName);

            if (!await DirHelper.directoryExist(nodeModulesPath)) {
                throw new Error(`node_modules directory not found: ${nodeModulesPath}`);
            }
        }

        const modules = await DirHelper.getFiles(nodeModulesPath);
        const informations: PluginInformation[] = [];

        for await (const aModule of modules) {
            const packageJsonPath = path.join(nodeModulesPath, aModule);

            if (await DirHelper.directoryExist(packageJsonPath)) {
                try {
                    const packageFile = path.join(packageJsonPath, 'package.json');
                    const packetData = await FileHelper.readJsonFile(packageFile);

                    if (packetData) {
                        if (packetData.flyingfish) {
                            const errors: SchemaErrors = [];

                            if (SchemaPluginDefinition.validate(packetData.flyingfish, errors)) {
                                informations.push({
                                    definition: packetData.flyingfish,
                                    path: packageJsonPath
                                });
                            } else {
                                console.log('PluginManager::scan: Config file error:', errors);
                            }
                        }
                    }
                } catch (e) {
                    Logger.getLogger().warn('PluginManager::scan: package.json can not read/parse');
                    Logger.getLogger().warn(e);
                }
            }
        }

        return informations;
    }

    /**
     * Load plugin to plugin-managaer by plugin information.
     * @param {PluginInformation} plugin - Plugin information.
     * @returns {boolean} Return true when is loaded.
     * @throws
     */
    public async load(plugin: PluginInformation): Promise<boolean> {
        try {
            let importFile: string|null = null;

            const pluginMain = path.join(plugin.path, plugin.definition.main);

            if (await FileHelper.fileExist(pluginMain, true)) {
                importFile = pluginMain;
            }

            if (plugin.definition.main_directory) {
                for await (const dir of plugin.definition.main_directory) {
                    const pluginSubMain = path.join(plugin.path, dir, plugin.definition.main);

                    if (await FileHelper.fileExist(pluginSubMain, true)) {
                        importFile = pluginSubMain;
                        break;
                    }
                }
            }

            if (importFile === null) {
                throw new Error(`plugin main not found: ${plugin.path}`);
            }

            if (this._checkDistHash) {
                if (plugin.definition.distHash === undefined) {
                    throw new Error(`plugin dist hash is empty!`);
                }

                const distDir = path.dirname(importFile);

                Logger.getLogger().silly(`PluginManager::load: check plugin hash by directory: ${distDir}`);

                const mtrh = new MerkleTreeRootHash();
                const pluginHash = await mtrh.fromFolder(distDir, true);

                Logger.getLogger().silly(`PluginManager::load: dist-hash check Direcotry: ${pluginHash} Plugin: ${plugin.definition.distHash}`);

                if (pluginHash === plugin.definition.distHash) {
                    Logger.getLogger().silly('PluginManager::load: dist-hash check: OK');
                } else {
                    throw new Error(`plugin dist hash is not identical! code manipulated?`);
                }
            }

            Logger.getLogger().silly('PluginManager::load: file plugin: %s (%s)', importFile, plugin.definition.name);

            const oPlugin = await import(importFile);

            console.log(oPlugin);

            const object = new oPlugin.default(plugin, this) as APlugin;

            if (object) {
                this._plugins.push(object);
                await object.onEnable();

                Logger.getLogger().info('PluginManager::load: Plugin is loaded %s', plugin.definition.name);
            }
        } catch (e) {
            Logger.getLogger().error('PluginManager::load: can not load plugin: %s %s', plugin.definition.name, Ets.formate(e, true));
            return false;
        }

        return true;
    }

    /**
     * Return all plugins.
     * @returns {APlugin[]}
     */
    public getPlugins(): APlugin[] {
        return this._plugins;
    }

    /**
     * Return a plugin by plugin-name.
     * @param {string} name - Name of a plugin.
     * @returns {APlugin|null}
     */
    public getPlugin(name: string): APlugin|null {
        const plugin = this._plugins.find((e) => e.getName() === name);

        if (plugin) {
            return plugin;
        }

        return null;
    }

    /**
     * Register an event, called from plugin.
     * @param {APluginEvent} listner - Listner event object.
     * @param {APlugin} plugin - A plugin instance.
     */
    public registerEvents(listner: APluginEvent, plugin: APlugin): void {
        const pluginName = plugin.getName();

        if (!this._events.has(pluginName)) {
            this._events.set(pluginName, []);
        }

        const events = this._events.get(pluginName);

        if (events) {
            events.push(listner);

            this._events.set(pluginName, events);
        }
    }

    /**
     * Return all Events
     * @param {Function} aClass
     * @template T
     * @returns {APluginEvent[]}
     */
    public getAllEvents<T extends APluginEvent>(aClass: Function): T[] {
        const eventList: T[] = [];

        for (const [, events] of this._events) {
            for (const aEvent of events) {
                if (aEvent instanceof aClass) {
                    eventList.push(aEvent as T);
                }
            }
        }

        return eventList;
    }

}