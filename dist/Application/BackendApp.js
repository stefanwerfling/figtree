import path from 'path';
import { ACL } from '../ACL/ACL.js';
import { ACLContributionProviders } from '../ACL/ACLContributionProviders.js';
import { ClusterRegistry } from '../Cluster/ClusterRegistry.js';
import { Config } from '../Config/Config.js';
import { ConfigBackend } from '../Config/ConfigBackend.js';
import { Args } from '../Env/Args.js';
import { Logger } from '../Logger/Logger.js';
import { OnBackendLifecycleEvent } from '../Plugins/OnBackendLifecycleEvent.js';
import { PluginManager } from '../Plugins/PluginManager.js';
import { CronJobProviders } from '../Service/CronJobProviders.js';
import { ServiceManager } from '../Service/ServiceManager.js';
import { ServiceProviders } from '../Service/ServiceProviders.js';
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
    _serviceManager = new ServiceManager();
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
    async _loadConfig() {
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
    async _initServices() {
    }
    async _initServicesFromPlugins() {
        if (!PluginManager.hasInstance()) {
            return;
        }
        let services;
        try {
            const [plainServices, cronJobs] = await Promise.all([
                new ServiceProviders().getProvidersServices(),
                new CronJobProviders().getProvidersJobs()
            ]);
            services = [...plainServices, ...cronJobs];
        }
        catch (err) {
            Logger.getLogger().warn('BackendApp::_initServicesFromPlugins: failed to load plugin services', err);
            return;
        }
        for (const { service, roles } of services) {
            const name = service.getServiceName();
            if (this._serviceManager.getByName(name) !== null) {
                Logger.getLogger().warn('BackendApp::_initServicesFromPlugins: skipping plugin service "%s" — a service with that name is already registered', name);
                continue;
            }
            this._serviceManager.add(service, roles);
            Logger.getLogger().info('BackendApp::_initServicesFromPlugins: registered plugin service "%s"', name);
        }
    }
    async _initACLFromPlugins() {
        if (!PluginManager.hasInstance()) {
            return;
        }
        let controllers;
        try {
            controllers = await new ACLContributionProviders().getProvidersControllers();
        }
        catch (err) {
            Logger.getLogger().warn('BackendApp::_initACLFromPlugins: failed to load plugin ACL controllers', err);
            return;
        }
        const acl = ACL.getInstance();
        for (const controller of controllers) {
            acl.addController(controller);
        }
        if (controllers.length > 0) {
            Logger.getLogger().info('BackendApp::_initACLFromPlugins: registered %d plugin ACL controller(s)', controllers.length);
        }
    }
    async start() {
        if (!await this._loadConfig()) {
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
            const timeout = new Promise((resolve) => {
                setTimeout(() => {
                    Logger.getLogger().warn('BackendApp::start::exitHook: Shutdown timeout reached, forcing exit.');
                    resolve();
                }, 10_000);
            });
            try {
                Logger.getLogger().info('Stop %s Service ...', Config.getInstance().getAppName());
                await this._fireLifecycleEvents('stop');
                if (ClusterRegistry.hasInstance()) {
                    await ClusterRegistry.getInstance().stop();
                }
                await Promise.race([this._serviceManager.stopAll(), timeout]);
                Logger.getLogger().info('... End.');
            }
            catch (e) {
                Logger.getLogger().error('BackendApp::start::exitHook: Error during shutdown:', e);
                console.trace();
            }
            finally {
                callback();
            }
        });
        Logger.getLogger().info('Start %s Service ...', Config.getInstance().getAppName());
        await this._initServices();
        await this._initServicesFromPlugins();
        await this._initACLFromPlugins();
        await this._serviceManager.startAll();
        if (ClusterRegistry.hasInstance()) {
            const registry = ClusterRegistry.getInstance();
            registry.register(this._serviceManager);
            await registry.start();
        }
        await this._fireLifecycleEvents('start');
    }
    async _fireLifecycleEvents(phase) {
        if (!PluginManager.hasInstance()) {
            return;
        }
        const events = PluginManager.getInstance().getAllEvents(OnBackendLifecycleEvent);
        for (const event of events) {
            try {
                if (phase === 'start') {
                    await event.onStart();
                }
                else {
                    await event.onStop();
                }
            }
            catch (err) {
                Logger.getLogger().error(`BackendApp::lifecycle::${phase}: plugin event ${event.getName()} failed`, err);
            }
        }
    }
    getServiceManager() {
        return this._serviceManager;
    }
}
//# sourceMappingURL=BackendApp.js.map