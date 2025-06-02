import path from 'path';
import {Schema} from 'vts';
import {Config} from '../Config/Config.js';
import {ConfigBackend} from '../Config/ConfigBackend.js';
import {Args} from '../Env/Args.js';
import {Logger} from '../Logger/Logger.js';
import {DefaultArgs} from '../Schemas/Args/DefaultArgs.js';
import {ConfigOptions} from '../Schemas/Config/ConfigOptions.js';
import {ServiceManager} from '../Service/ServiceManager.js';
import {FileHelper} from '../Utils/FileHelper.js';
import exitHook from 'async-exit-hook';

/**
 * BackendApp
 * @template A, C
 */
export abstract class BackendApp<A extends DefaultArgs, C extends ConfigOptions> {

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
    public constructor(name: string = 'figtree') {
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
    protected _getConfigInstance(): Config<C> {
        return ConfigBackend.getInstance<C>();
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
    protected async _initServices(): Promise<void> {}

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
            try {
                Logger.getLogger().info('Stop %s Service ...', Config.getInstance().getAppName());

                await this._serviceManager.stopAll();

                Logger.getLogger().info('... End.');
            } catch (e) {
                Logger.getLogger().error("BackendApp::start::exitHook: Error during shutdown:", e);
                console.trace();
            } finally {
                callback();
            }
        });

        // -------------------------------------------------------------------------------------------------------------

        Logger.getLogger().info('Start %s Service ...', Config.getInstance().getAppName());
        await this._initServices();
        await this._serviceManager.startAll();
    }

    /**
     * Return the service manager
     * @return {ServiceManager}
     */
    public getServiceManager(): ServiceManager {
        return this._serviceManager;
    }

}