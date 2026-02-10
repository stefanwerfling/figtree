import {ConfigBackendOptions, SchemaConfigDbOptionsMySql} from 'figtree-schemas';
import {Config} from '../../Config/Config.js';
import {DBHelper} from '../../Db/MariaDb/DBHelper.js';
import {DbSetupStateRepository} from '../../Db/MariaDb/Defaults/Repository/DbSetupStateRepository.js';
import {DBLoaderType} from './MariaDBService/DBLoader.js';
import {Logger} from '../../Logger/Logger.js';
import {ServiceAbstract, ServiceImportance, ServiceStatus} from '../../Service/ServiceAbstract.js';
import {ServiceError} from '../../Service/ServiceError.js';
import {StringHelper} from '../../Utils/StringHelper.js';
import {DBSetupHook} from './MariaDBService/DBSetupHook.js';

/**
 * Maria DB Service Options
 */
export type MariaDBServiceOptions = {
    migrationsRun?: boolean;
    synchronize?: boolean;
};

/**
 * Maria DB Service
 */
export class MariaDBService extends ServiceAbstract {

    /**
     * Name of mariadb service
     */
    public static NAME = 'mariadb';

    /**
     * Importance
     */
    protected readonly _importance: ServiceImportance = ServiceImportance.Important;

    /**
     * Loader
     * @protected
     */
    protected _loader: DBLoaderType;

    /**
     * setup hooks
     * @protected
     */
    protected _setupHooks: DBSetupHook[] = [];

    /**
     * options
     * @protected
     */
    protected _options: MariaDBServiceOptions;

    /**
     * Constructor
     * @param {DBLoaderType} loader
     * @param {[string]} serviceName
     * @param {[string[]]} serviceDependencies
     * @param {MariaDBServiceOptions} options
     * @param {DBSetupHook[]} setupHooks
     */
    public constructor(loader: DBLoaderType, serviceName?: string, serviceDependencies?: string[], options?: MariaDBServiceOptions, setupHooks?: DBSetupHook[]) {
        super(serviceName ?? MariaDBService.NAME, serviceDependencies);
        this._loader = loader;

        this._options = options ?? { migrationsRun: true, synchronize: true };

        if (setupHooks) {
            this._setupHooks = setupHooks;
        }
    }

    /**
     * Register a setup hook
     * @param {DBSetupHook} hook
     */
    public registerSetupHook(hook: DBSetupHook): void {
        this._setupHooks.push(hook);
    }

    /**
     * run setup hooks
     * @protected
     */
    protected async _runSetupHooks(): Promise<void> {
        const repo = DbSetupStateRepository.getInstance();

        for (const hook of this._setupHooks) {
            if (hook.mode === 'once') {
                const applied = await repo.isApplied(hook.id);
                if (applied) continue;

                Logger.getLogger().info(`Running once-hook: ${hook.id}`, { class: 'MariaDBService' });
                await hook.run();
                await repo.markApplied(hook.id);

            } else if (hook.mode === 'always') {
                Logger.getLogger().info(`Running always-hook: ${hook.id}`, { class: 'MariaDBService' });
                await hook.run();
            }
        }
    }

    /**
     * Start the service
     */
    public override async start(): Promise<void> {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;

        try {
            const tConfig = Config.getInstance().get() as ConfigBackendOptions;

            if (tConfig === null) {
                throw new ServiceError(
                    this.constructor.name,
                    'Config is null. Check your config file exists!'
                );
            }

            if (tConfig.db && tConfig.db.mysql && !SchemaConfigDbOptionsMySql.validate(tConfig.db.mysql, [])) {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration is invalid. Check your config file format and values.'
                );
            }

            if (tConfig.db.mysql === undefined) {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration for mysql/mariadb is not set. Check your config file format and values.'
                );
            }

            await DBHelper.init({
                type: 'mysql',
                host: tConfig.db.mysql.host,
                port: tConfig.db.mysql.port,
                username: tConfig.db.mysql.username,
                password: tConfig.db.mysql.password,
                database: tConfig.db.mysql.database,
                entities: await this._loader.loadEntities(),
                migrations: this._loader.loadMigrations(),
                migrationsRun: this._options.migrationsRun !== undefined ? this._options.migrationsRun : true,
                synchronize: this._options.synchronize !== undefined ? this._options.synchronize : true,
            });

            await this._runSetupHooks();
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;

            this._statusMsg = StringHelper.sprintf(
                'MariaDBService::start: Error while connecting to the MariaDB: %e',
                error
            );

            Logger.getLogger().error(this._statusMsg);

            throw error;
        }

        this._statusMsg = '';
        this._status = ServiceStatus.Success;
        this._inProcess = false;
    }

    /**
     * Stop the service
     */
    public override async stop(): Promise<void> {
        try {
            await DBHelper.closeAllSources();
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('MariaDBService::stop: Error stopping the MariaDB: %e', error);

            Logger.getLogger().error(this._statusMsg);
        } finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }
}