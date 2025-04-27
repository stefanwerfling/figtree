import {Config} from '../../Config/Config.js';
import {DBHelper} from '../../Db/MariaDb/DBHelper.js';
import {DBLoaderType} from '../../Db/MariaDb/DBLoader.js';
import {Logger} from '../../Logger/Logger.js';
import {SchemaConfigBackendOptions} from '../../Schemas/Config/ConfigBackendOptions.js';
import {ServiceAbstract, ServiceStatus} from '../../Service/ServiceAbstract.js';
import {StringHelper} from '../../Utils/StringHelper.js';

export class MariaDbService extends ServiceAbstract {

    protected _loader: DBLoaderType;

    public constructor(loader: DBLoaderType) {
        super();
        this._loader = loader;
    }

    /**
     * Start the service
     */
    public override async start(): Promise<void> {
        try {
            const tConfig = Config.getInstance().get();

            if (tConfig === null) {
                this._status = ServiceStatus.Error;
                this._statusMsg = 'MariaDbService::start: Error while connecting to the MariaDB, check your config file exist!';
                Logger.getLogger().error(this._statusMsg);

                this._inProcess = false;
                return;
            }

            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                this._status = ServiceStatus.Error;
                this._statusMsg = 'MariaDbService::start: Error while connecting to the MariaDB, check your config is correct setup!';
                Logger.getLogger().error(this._statusMsg);

                this._inProcess = false;
                return;
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
            this._statusMsg = StringHelper.sprintf('MariaDbService::start: Error while connecting to the MariaDB: %e', error);
            Logger.getLogger().error(this._statusMsg);

            this._inProcess = false;
            return;
        }

        this._inProcess = true;
    }

    /**
     * Stop the service
     * @param {boolean} forced
     */
    public async stop(forced: boolean = false): Promise<void> {
        try {
            await DBHelper.closeAllSources();
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('MariaDbService::stop: Error stop connecting to the MariaDB: %e', error);
            Logger.getLogger().error(this._statusMsg);
        } finally {
            this._inProcess = false;
        }
    }
}