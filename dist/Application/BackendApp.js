import path from 'path';
import { Config } from '../Config/Config.js';
import { ConfigBackend } from '../Config/ConfigBackend.js';
import { Args } from '../Env/Args.js';
import { Logger } from '../Logger/Logger.js';
import { ServiceList } from '../Service/ServiceList.js';
import { FileHelper } from '../Utils/FileHelper.js';
import exitHook from 'async-exit-hook';
export class BackendApp {
    static _instances = new Map();
    static getInstance(name) {
        if (BackendApp._instances.has(name)) {
            return BackendApp._instances.get(name) ?? null;
        }
        return null;
    }
    _appName = 'figtree';
    _args = null;
    _serviceList = new ServiceList();
    constructor(name = 'figtree') {
        this._appName = name;
        BackendApp._instances.set(name, this);
    }
    _getArgSchema() {
        return null;
    }
    _getConfigInstance() {
        return ConfigBackend.getInstance();
    }
    async _loadCofig() {
        const argSchema = this._getArgSchema();
        let configfile = null;
        if (argSchema !== null) {
            this._args = Args.get(argSchema);
            if (this._args.config) {
                configfile = this._args.config;
                try {
                    if (!await FileHelper.fileExist(configfile)) {
                        console.log(`BackendApp::_loadCofig: Config not found: ${configfile}, exit.`);
                        return false;
                    }
                }
                catch (err) {
                    console.log(`BackendApp::_loadCofig: Config is not load: ${configfile}, exit.`);
                    console.error(err);
                    return false;
                }
            }
        }
        if (configfile === null) {
            const defaultConfig = path.join(path.resolve(), `/${Config.DEFAULT_CONFIG_FILE}`);
            if (await FileHelper.fileExist(defaultConfig)) {
                console.log(`BackendApp::_loadCofig: Found and use setup config: ${defaultConfig} ....`);
                configfile = defaultConfig;
            }
        }
        let useEnv = false;
        if (this._args) {
            if (this._args.envargs && this._args.envargs === '1') {
                useEnv = true;
            }
        }
        const tConfig = await this._getConfigInstance().load(configfile, useEnv);
        if (tConfig === null) {
            console.log(`BackendApp::_loadCofig: Configloader is return empty config, please check your configfile: ${configfile}`);
            return false;
        }
        return true;
    }
    _initLogger() {
        Logger.getLogger();
    }
    async _initServices() { }
    async start() {
        if (!await this._loadCofig()) {
            return;
        }
        this._initLogger();
        Logger.getLogger().info('Start %s Service ...', Config.getInstance().getAppName());
        process.on('uncaughtException', (err) => {
            Logger.getLogger().error(err);
        });
        process.on('unhandledRejection', (reason, promise) => {
            Logger.getLogger().error(reason);
            Logger.getLogger().error(promise);
        });
        exitHook(async (callback) => {
            try {
                Logger.getLogger().info('Stop %s Service ...', Config.getInstance().getAppName());
                await this._serviceList.stopAll();
                Logger.getLogger().info('... End.');
            }
            catch (e) {
                Logger.getLogger().error("BackendApp::start::exitHook: Error during shutdown:", e);
                console.trace();
            }
            finally {
                callback();
            }
        });
        Logger.getLogger().info('Start %s Service ...', Config.getInstance().getAppName());
        await this._initServices();
        await this._serviceList.startAll();
    }
    getServiceList() {
        return this._serviceList;
    }
}
//# sourceMappingURL=BackendApp.js.map