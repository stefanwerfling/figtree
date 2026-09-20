import {ConfigOptions, DefaultArgs} from 'figtree-schemas';
import path from 'path';
import {Schema} from 'vts';
import {ACL} from '../ACL/ACL.js';
import {ACLContributionProviders} from '../ACL/ACLContributionProviders.js';
import {ClusterRegistry} from '../Cluster/ClusterRegistry.js';
import {Config} from '../Config/Config.js';
import {ConfigBackend} from '../Config/ConfigBackend.js';
import {Args} from '../Env/Args.js';
import {Logger} from '../Logger/Logger.js';
import {OnBackendLifecycleEvent} from '../Plugins/OnBackendLifecycleEvent.js';
import {PluginManager} from '../Plugins/PluginManager.js';
import {CronJobProviders} from '../Service/CronJobProviders.js';
import {ServiceManager} from '../Service/ServiceManager.js';
import {ServiceProviders} from '../Service/ServiceProviders.js';
import {FileHelper} from '../Utils/FileHelper.js';
import exitHook from 'async-exit-hook';

/**
 * BackendApp
 * @template A, _C
 */
export abstract class BackendApp<A extends DefaultArgs, _C extends ConfigOptions> {

    /**
     * Hold all instances
     * @private
     */
    private static _instances: Map<string, BackendApp<any, any>> = new Map<string, BackendApp<any, any>>();

    /**
     * Return a global instance from backend by name
     * @param {string} name
     * @return {BackendApp<any, any>|null}
     */
    public static getInstance(name: string): BackendApp<any, any>|null {
        if (BackendApp._instances.has(name)) {
            return BackendApp._instances.get(name) ?? null;
        }

        return null;
    }

    /**
     * Default appname, override this
     * @protected
     */
    protected _appName: string = 'figtree';

    /**
     * Args
     * @protected
     */
    protected _args: A|null = null;

    /**
     * Service Manager
     * @protected
     */
    protected _serviceManager: ServiceManager = new ServiceManager();

    /**
     * constructor
     * @param {string} name
     */
    protected constructor(name: string = 'figtree') {
        this._appName = name;
        BackendApp._instances.set(name, this);
    }

    /**
     * Return the Arg Schema
     * @protected
     * @return {Schema<A>|null}
     */
    protected _getArgSchema(): Schema<A>|null {
        return null;
    }

    /**
     * Return the config instance
     * @protected
     */
    protected _getConfigInstance(): ConfigBackend {
        return ConfigBackend.getInstance();
    }

    /**
     * Load Config by env or file
     * @protected
     * @return {boolean}
     */
    protected async _loadConfig(): Promise<boolean> {
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
                } catch (err) {
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

    /**
     * Init Logger
     * @protected
     */
    protected _initLogger(): void {
        Logger.getLogger();
    }

    /**
     * Init the Services
     * @protected
     */
    protected async _initServices(): Promise<void> {
        // override in subclass to register services
    }

    /**
     * Register services contributed by plugins via `IServiceProvider` and cron
     * jobs contributed via `ICronJobProvider`.
     *
     * Runs after `_initServices()` (so host services are registered first) and
     * before `ServiceManager.startAll()` (so plugin services take part in the
     * normal dependency-ordered startup). A no-op when no plugin manager has
     * been initialized. Errors while collecting providers are logged but do not
     * abort startup; a plugin service whose name collides with an already
     * registered service is skipped with a warning. Cron jobs are normalized to
     * the same shape and default to the `cron` cluster role.
     * @protected
     */
    protected async _initServicesFromPlugins(): Promise<void> {
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
        } catch (err) {
            Logger.getLogger().warn('BackendApp::_initServicesFromPlugins: failed to load plugin services', err);
            return;
        }

        for (const {service, roles} of services) {
            const name = service.getServiceName();

            if (this._serviceManager.getByName(name) !== null) {
                Logger.getLogger().warn(
                    'BackendApp::_initServicesFromPlugins: skipping plugin service "%s" — a service with that name is already registered',
                    name
                );

                continue;
            }

            this._serviceManager.add(service, roles);
            Logger.getLogger().info('BackendApp::_initServicesFromPlugins: registered plugin service "%s"', name);
        }
    }

    /**
     * Register ACL controllers contributed by plugins via
     * `IACLContributionProvider`.
     *
     * Runs before `ServiceManager.startAll()` so the controllers are in place
     * before the HTTP/WebSocket services begin serving traffic. Controllers are
     * appended to the process-wide `ACL` singleton in provider registration
     * order (`ACL.checkAccess` consults them in that order, first match wins). A
     * no-op when no plugin manager has been initialized; errors while collecting
     * providers are logged but do not abort startup.
     * @protected
     */
    protected async _initACLFromPlugins(): Promise<void> {
        if (!PluginManager.hasInstance()) {
            return;
        }

        let controllers;

        try {
            controllers = await new ACLContributionProviders().getProvidersControllers();
        } catch (err) {
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

    /**
     * Start backend app
     */
    public async start(): Promise<void> {
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

        exitHook(async(callback): Promise<void> => {
            const timeout = new Promise<void>((resolve) => {
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
            } catch (e) {
                Logger.getLogger().error('BackendApp::start::exitHook: Error during shutdown:', e);
                console.trace();
            } finally {
                callback();
            }
        });

        // -------------------------------------------------------------------------------------------------------------

        Logger.getLogger().info('Start %s Service ...', Config.getInstance().getAppName());
        await this._initServices();
        await this._initServicesFromPlugins();
        await this._initACLFromPlugins();
        await this._serviceManager.startAll();

        // If the consumer initialized a ClusterRegistry singleton in _initServices,
        // auto-register the ServiceManager and start the heartbeat after services
        // are up so the first tick shows a meaningful state.
        if (ClusterRegistry.hasInstance()) {
            const registry = ClusterRegistry.getInstance();
            registry.register(this._serviceManager);
            await registry.start();
        }

        // Plugin lifecycle hooks — fired after services and the cluster
        // registry are fully up.
        await this._fireLifecycleEvents('start');
    }

    /**
     * Fire `OnBackendLifecycleEvent.onStart` / `onStop` on every registered
     * plugin event. Errors in individual hooks are logged but do not abort
     * the lifecycle.
     * @param {'start'|'stop'} phase
     * @private
     */
    private async _fireLifecycleEvents(phase: 'start' | 'stop'): Promise<void> {
        if (!PluginManager.hasInstance()) {
            return;
        }

        const events = PluginManager.getInstance().getAllEvents(OnBackendLifecycleEvent);

        for (const event of events) {
            try {
                if (phase === 'start') {
                    // sequential by design — earlier plugins may set up state later ones depend on
                    // eslint-disable-next-line no-await-in-loop
                    await event.onStart();
                } else {
                    // eslint-disable-next-line no-await-in-loop
                    await event.onStop();
                }
            } catch (err) {
                Logger.getLogger().error(`BackendApp::lifecycle::${phase}: plugin event ${event.getName()} failed`, err);
            }
        }
    }

    /**
     * Return the service manager
     * @return {ServiceManager}
     */
    public getServiceManager(): ServiceManager {
        return this._serviceManager;
    }

}