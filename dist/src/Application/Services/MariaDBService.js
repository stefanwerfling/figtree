import { Config } from '../../Config/Config.js';
import { DBHelper } from '../../Db/MariaDb/DBHelper.js';
import { Logger } from '../../Logger/Logger.js';
import { SchemaConfigBackendOptions } from '../../Schemas/Config/ConfigBackendOptions.js';
import { ServiceAbstract, ServiceStatus } from '../../Service/ServiceAbstract.js';
import { StringHelper } from '../../Utils/StringHelper.js';
export class MariaDBService extends ServiceAbstract {
    _loader;
    constructor(loader) {
        super();
        this._loader = loader;
    }
    async start() {
        this._status = ServiceStatus.Progress;
        try {
            const tConfig = Config.getInstance().get();
            if (tConfig === null) {
                this._status = ServiceStatus.Error;
                this._statusMsg = 'MariaDBService::start: Error while connecting to the MariaDB, check your config file exist!';
                Logger.getLogger().error(this._statusMsg);
                this._inProcess = false;
                return;
            }
            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                this._status = ServiceStatus.Error;
                this._statusMsg = 'MariaDBService::start: Error while connecting to the MariaDB, check your config is correct setup!';
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
        }
        catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('MariaDBService::start: Error while connecting to the MariaDB: %e', error);
            Logger.getLogger().error(this._statusMsg);
            this._inProcess = false;
            return;
        }
        this._status = ServiceStatus.Success;
        this._inProcess = true;
    }
    async stop(forced = false) {
        try {
            await DBHelper.closeAllSources();
        }
        catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('MariaDBService::stop: Error stopping the MariaDB: %e', error);
            Logger.getLogger().error(this._statusMsg);
        }
        finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }
}
//# sourceMappingURL=MariaDBService.js.map