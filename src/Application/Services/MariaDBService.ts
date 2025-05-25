import {Config} from '../../Config/Config.js';
import {DBHelper} from '../../Db/MariaDb/DBHelper.js';
import {DBLoaderType} from '../../Db/MariaDb/DBLoader.js';
import {Logger} from '../../Logger/Logger.js';
import {SchemaConfigBackendOptions} from '../../Schemas/Config/ConfigBackendOptions.js';
import {ServiceAbstract, ServiceImportance, ServiceStatus} from '../../Service/ServiceAbstract.js';
import {ServiceError} from '../../Service/ServiceError.js';
import {StringHelper} from '../../Utils/StringHelper.js';

/**
 * Maria DB Service
 */
export class MariaDBService extends ServiceAbstract {

    /**
     * Importance
     */
    protected readonly _importance: ServiceImportance = ServiceImportance.Critical;

    /**
     * Loader
     * @protected
     */
    protected _loader: DBLoaderType;

    /**
     * Constructor
     * @param {DBLoaderType} loader
     * @param {[string]} serviceName
     * @param {[string[]]} serviceDependencies
     */
    public constructor(loader: DBLoaderType, serviceName?: string, serviceDependencies?: string[]) {
        super(serviceName, serviceDependencies);
        this._loader = loader;
    }

    /**
     * Start the service
     */
    public override async start(): Promise<void> {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;

        try {
            const tConfig = Config.getInstance().get();

            if (tConfig === null) {
                throw new ServiceError(
                    this.constructor.name,
                    'Config is null. Check your config file exists!'
                );
            }

            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration is invalid. Check your config file format and values.'
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
                migrationsRun: true,
                synchronize: true
            });
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
     * @param {boolean} forced
     */
    public override async stop(forced: boolean = false): Promise<void> {
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