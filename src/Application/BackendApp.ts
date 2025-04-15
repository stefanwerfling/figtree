import path from 'path';
import {Schema, Vts} from 'vts';
import {Config} from '../Config/Config.js';
import {ConfigBackend} from '../Config/ConfigBackend.js';
import {DBEntitiesLoaderType} from '../Db/DBEntitiesLoader.js';
import {DBHelper} from '../Db/DBHelper.js';
import {Args} from '../Env/Args.js';
import {Logger} from '../Logger/Logger.js';
import {DefaultArgs} from '../Schemas/Args/DefaultArgs.js';
import {SchemaConfigBackendOptions} from '../Schemas/Config/ConfigBackendOptions.js';
import {ConfigOptions} from '../Schemas/Config/ConfigOptions.js';
import {FileHelper} from '../Utils/FileHelper.js';
import exitHook from 'async-exit-hook';

/**
 * BackendApp
 */
export abstract class BackendApp<A extends DefaultArgs, C extends ConfigOptions> {

    /**
     * Default appname, override this
     * @protected
     */
    protected _appName: string = 'figstree';

    /**
     * Args
     * @protected
     */
    protected _args: A|null = null;

    protected _getArgSchema(): Schema<A>|null {
        return null;
    }

    protected _getConfigInstance(): Config<C> {
        return ConfigBackend.getInstance<C>();
    }

    protected async _loadCofig(): Promise<boolean> {
        const argSchema = this._getArgSchema();
        let configfile = null;

        if (argSchema !== null) {
            this._args = Args.get(argSchema);

            if (this._args.config) {
                configfile = this._args.config;

                try {
                    if (!await FileHelper.fileExist(configfile)) {
                        console.log(`Config not found: ${configfile}, exit.`);
                        return false;
                    }
                } catch (err) {
                    console.log(`Config is not load: ${configfile}, exit.`);
                    console.error(err);
                    return false;
                }
            }
        }

        if (configfile === null) {
            const defaultConfig = path.join(path.resolve(), `/${Config.DEFAULT_CONFIG_FILE}`);

            if (await FileHelper.fileExist(defaultConfig)) {
                console.log(`Found and use setup config: ${defaultConfig} ....`);
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
            console.log(`Configloader is return empty config, please check your configfile: ${configfile}`);
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
     * Start backend app
     */
    public async start(): Promise<void> {
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

        exitHook(async(callback): Promise<void> => {
            try {
                Logger.getLogger().info('Stop %s Service ...', Config.getInstance().getAppName());
                Logger.getLogger().info('... End.');
            } catch (e) {
                Logger.getLogger().error("Error during shutdown:", e);
                console.trace();
            } finally {
                callback();
            }
        });

        // -------------------------------------------------------------------------------------------------------------

        await this._startServices();
    }

    protected async _startMariaDBService(entitiesLoader: DBEntitiesLoaderType): Promise<boolean> {
        try {
            const tConfig = Config.getInstance().get();

            if (tConfig === null) {
                Logger.getLogger().error('Error while connecting to the database, check your config file exist!');
                return false;
            }

            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                Logger.getLogger().error('Error while connecting to the database, check your config is correct setup!');
                return false;
            }

            await DBHelper.init({
                type: 'mysql',
                host: tConfig.db.mysql.host,
                port: tConfig.db.mysql.port,
                username: tConfig.db.mysql.username,
                password: tConfig.db.mysql.password,
                database: tConfig.db.mysql.database,
                entities: await entitiesLoader.loadEntities(),
                migrations: [],
                migrationsRun: true,
                synchronize: true
            });
        } catch (error) {
            Logger.getLogger().error('Error while connecting to the database: %s', error);
            return false;
        }

        return true;
    }

    /**
     * Start services
     * @protected
     */
    protected async _startServices(): Promise<void> {
        Logger.getLogger().info('Start %s Service ...', Config.getInstance().getAppName());
    }
}