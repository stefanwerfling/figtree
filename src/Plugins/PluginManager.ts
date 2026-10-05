import {Ets} from 'ets';
import {SchemaPluginDefinition} from 'figtree-schemas';
import {SchemaErrors} from 'vts';
import {MerkleTreeRootHash} from '../Crypto/MerkleTreeRootHash.js';
import {Logger} from '../Logger/Logger.js';
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
    /**
     * Key in `package.json` under which plugin metadata is expected.
     * Defaults to `'figtree'`. Override if you ship plugins for a specific
     * host (e.g. `'flyingfish'`) and want to avoid name collisions.
     */
    pluginKey?: string;
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
     * package.json key under which plugin metadata is expected.
     * @protected
     */
    protected _pluginKey: string = 'figtree';

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
     * Loaded plugin instances keyed by their manifest name (`definition.name`).
     * Kept alongside {@link _plugins} so a plugin can be addressed by the same
     * stable name the host persists its enabled/config state under, even though
     * the runtime {@link APlugin.getName} may differ from the manifest name.
     * @member {Map<string, APlugin>}
     */
    protected _loaded: Map<string, APlugin> = new Map<string, APlugin>();

    /**
     * Last scan result, cached so disabled (not loaded) plugins can still be
     * listed and later enabled without re-scanning.
     * @member {PluginInformation[]}
     */
    protected _informations: PluginInformation[] = [];

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
        return PluginManager._instance !== null;
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

        if (options.pluginKey) {
            this._pluginKey = options.pluginKey;
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

        // Cache the scan so the host can enumerate every discovered (signed)
        // plugin later — including ones it may disable at runtime — without
        // re-scanning node_modules.
        this._informations = pluginInfos;

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
            // sequential by design — plugins disable in dependency order
            // eslint-disable-next-line no-await-in-loop
            await plugin.onDisable();
        }

        this._events.clear();
        this._plugins = [];
        this._loaded.clear();
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
            const modulePath = path.join(nodeModulesPath, aModule);

            if (!await DirHelper.directoryExist(modulePath)) {
                continue;
            }

            // Scoped packages (@scope/name) live one level deeper: @scope itself
            // is a plain directory with no package.json of its own, so recurse
            // into its entries instead of trying (and failing) to read one here.
            if (aModule.startsWith('@')) {
                const scopedModules = await DirHelper.getFiles(modulePath);

                for await (const scopedModule of scopedModules) {
                    await this._scanModule(
                        path.join(modulePath, scopedModule),
                        informations
                    );
                }

                continue;
            }

            await this._scanModule(modulePath, informations);
        }

        return informations;
    }

    /**
     * Read a single node_modules package's package.json and, if it carries a
     * valid plugin definition, add it to `informations`.
     * @param {string} packagePath
     * @param {PluginInformation[]} informations
     * @private
     */
    private async _scanModule(packagePath: string, informations: PluginInformation[]): Promise<void> {
        if (!await DirHelper.directoryExist(packagePath)) {
            return;
        }

        try {
            const packageFile = path.join(packagePath, 'package.json');
            const packetData = await FileHelper.readJsonFile(packageFile);

            if (packetData) {
                const definition = packetData[this._pluginKey];

                if (definition) {
                    const errors: SchemaErrors = [];

                    if (SchemaPluginDefinition.validate(definition, errors)) {
                        informations.push({
                            definition: definition,
                            path: packagePath
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
                    throw new Error('plugin dist hash is empty!');
                }

                const distDir = path.dirname(importFile);

                Logger.getLogger().silly(`PluginManager::load: check plugin hash by directory: ${distDir}`);

                const mtrh = new MerkleTreeRootHash();
                const pluginHash = await mtrh.fromFolder(distDir, true);

                Logger.getLogger().silly(`PluginManager::load: dist-hash check Direcotry: ${pluginHash} Plugin: ${plugin.definition.distHash}`);

                if (pluginHash === plugin.definition.distHash) {
                    Logger.getLogger().silly('PluginManager::load: dist-hash check: OK');
                } else {
                    throw new Error('plugin dist hash is not identical! code manipulated?');
                }
            }

            Logger.getLogger().silly('PluginManager::load: file plugin: %s (%s)', importFile, plugin.definition.name);

            const oPlugin = await import(importFile);

            const object = new oPlugin.default(plugin, this) as APlugin;

            if (object) {
                this._plugins.push(object);
                this._loaded.set(plugin.definition.name, object);
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
     * Return the cached scan result: every discovered (signed) plugin, whether
     * currently loaded or not. Populated by {@link start}; empty before the
     * first scan.
     * @returns {PluginInformation[]}
     */
    public getInformations(): PluginInformation[] {
        return this._informations;
    }

    /**
     * Return a loaded plugin instance by its manifest name (`definition.name`),
     * or null when it is not loaded.
     * @param {string} name - Manifest name of a plugin.
     * @returns {APlugin|null}
     */
    public getLoadedPlugin(name: string): APlugin|null {
        return this._loaded.get(name) ?? null;
    }

    /**
     * Enable (load) a plugin at runtime by its manifest name. No-op returning
     * true when it is already loaded. Scans first when the cache is empty so a
     * plugin can be enabled without a prior {@link start}.
     * @param {string} name - Manifest name of a plugin.
     * @returns {Promise<boolean>} true when the plugin is loaded afterwards.
     */
    public async enablePlugin(name: string): Promise<boolean> {
        if (this._loaded.has(name)) {
            return true;
        }

        if (this._informations.length === 0) {
            this._informations = await this.scan();
        }

        const info = this._informations.find((e) => e.definition.name === name);

        if (!info) {
            Logger.getLogger().warn('PluginManager::enablePlugin: plugin not found: %s', name);
            return false;
        }

        return this.load(info);
    }

    /**
     * Disable (unload) a plugin at runtime by its manifest name: calls its
     * `onDisable`, then drops its instance and registered events. The plugin
     * stays in the scan cache so it can be enabled again. No-op returning true
     * when it is not loaded.
     * @param {string} name - Manifest name of a plugin.
     * @returns {Promise<boolean>} true when the plugin is unloaded afterwards.
     */
    public async disablePlugin(name: string): Promise<boolean> {
        const plugin = this._loaded.get(name);

        if (!plugin) {
            return true;
        }

        try {
            await plugin.onDisable();
        } catch (e) {
            Logger.getLogger().error('PluginManager::disablePlugin: onDisable failed for %s: %s', name, Ets.formate(e, true));
        }

        this._events.delete(plugin.getName());
        this._loaded.delete(name);
        this._plugins = this._plugins.filter((e) => e !== plugin);

        return true;
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
     * @param {abstract new (...args: any[]) => T} aClass
     * @template T
     * @returns {APluginEvent[]}
     */
    public getAllEvents<T extends APluginEvent>(aClass: abstract new (...args: any[]) => T): T[] {
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