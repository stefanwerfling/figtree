import { Ets } from 'ets';
import { Logger } from '../Logger/Logger.js';
import { SchemaPluginDefinition } from '../Schemas/Plugin/PluginDefinition.js';
import { DirHelper } from '../Utils/DirHelper.js';
import { FileHelper } from '../Utils/FileHelper.js';
import path from 'path';
export class PluginManager {
    static _instance = null;
    _appPath;
    _serviceName;
    _plugins = [];
    _events = new Map();
    static getInstance() {
        if (PluginManager._instance === null) {
            throw new Error('PluginManager::getInstance: instance is empty, please init first plugin manager!');
        }
        return PluginManager._instance;
    }
    constructor(serviceName, appPath) {
        if (appPath) {
            this._appPath = appPath;
        }
        this._appPath = path.join(path.resolve());
        this._serviceName = serviceName;
        PluginManager._instance = this;
    }
    getServiceName() {
        return this._serviceName;
    }
    async start() {
        const pluginInfos = await this.scan();
        for await (const pluginInfo of pluginInfos) {
            Logger.getLogger().silly('PluginManager::start: found plugin: %s (%s)', pluginInfo.definition.name, pluginInfo.definition.version);
            await this.load(pluginInfo);
        }
    }
    async scan() {
        let nodeModulesPath = path.join(this._appPath, 'node_modules');
        if (!await DirHelper.directoryExist(nodeModulesPath)) {
            nodeModulesPath = path.join(this._appPath, 'node_modules', this._serviceName);
            if (!await DirHelper.directoryExist(nodeModulesPath)) {
                throw new Error(`node_modules directory not found: ${nodeModulesPath}`);
            }
        }
        const modules = await DirHelper.getFiles(nodeModulesPath);
        const informations = [];
        for await (const aModule of modules) {
            const packageJsonPath = path.join(nodeModulesPath, aModule);
            if (await DirHelper.directoryExist(packageJsonPath)) {
                try {
                    const packageFile = path.join(packageJsonPath, 'package.json');
                    const packetData = await FileHelper.readJsonFile(packageFile);
                    if (packetData) {
                        if (packetData.flyingfish) {
                            const errors = [];
                            if (SchemaPluginDefinition.validate(packetData.flyingfish, errors)) {
                                informations.push({
                                    definition: packetData.flyingfish,
                                    path: packageJsonPath
                                });
                            }
                            else {
                                console.log('PluginManager::scan: Config file error:', errors);
                            }
                        }
                    }
                }
                catch (e) {
                    Logger.getLogger().warn('PluginManager::scan: package.json can not read/parse');
                    Logger.getLogger().warn(e);
                }
            }
        }
        return informations;
    }
    async load(plugin) {
        try {
            let importFile = null;
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
            Logger.getLogger().silly('PluginManager::load: file plugin: %s (%s)', importFile, plugin.definition.name);
            const oPlugin = await import(importFile);
            console.log(oPlugin);
            const object = new oPlugin.default(plugin, this);
            if (object) {
                this._plugins.push(object);
                object.onEnable();
                Logger.getLogger().info('PluginManager::load: Plugin is loaded %s', plugin.definition.name);
            }
        }
        catch (e) {
            Logger.getLogger().error('PluginManager::load: can not load plugin: %s %s', plugin.definition.name, Ets.formate(e, true));
            return false;
        }
        return true;
    }
    getPlugins() {
        return this._plugins;
    }
    getPlugin(name) {
        const plugin = this._plugins.find((e) => e.getName() === name);
        if (plugin) {
            return plugin;
        }
        return null;
    }
    registerEvents(listner, plugin) {
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
    getAllEvents(aClass) {
        const eventList = [];
        for (const [, events] of this._events) {
            for (const aEvent of events) {
                if (aEvent instanceof aClass) {
                    eventList.push(aEvent);
                }
            }
        }
        return eventList;
    }
}
//# sourceMappingURL=PluginManager.js.map