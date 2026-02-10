import { SchemaConfigDbOptionsMySql } from 'figtree-schemas';
import { Config } from '../../Config/Config.js';
import { DBHelper } from '../../Db/MariaDb/DBHelper.js';
import { DbSetupStateRepository } from '../../Db/MariaDb/Defaults/Repository/DbSetupStateRepository.js';
import { Logger } from '../../Logger/Logger.js';
import { ServiceAbstract, ServiceImportance, ServiceStatus } from '../../Service/ServiceAbstract.js';
import { ServiceError } from '../../Service/ServiceError.js';
import { StringHelper } from '../../Utils/StringHelper.js';
export class MariaDBService extends ServiceAbstract {
    static NAME = 'mariadb';
    _importance = ServiceImportance.Important;
    _loader;
    _setupHooks = [];
    _options;
    constructor(loader, serviceName, serviceDependencies, options, setupHooks) {
        super(serviceName ?? MariaDBService.NAME, serviceDependencies);
        this._loader = loader;
        this._options = options ?? { migrationsRun: true, synchronize: true };
        if (setupHooks) {
            this._setupHooks = setupHooks;
        }
    }
    registerSetupHook(hook) {
        this._setupHooks.push(hook);
    }
    async _runSetupHooks() {
        const repo = DbSetupStateRepository.getInstance();
        for (const hook of this._setupHooks) {
            if (hook.mode === 'once') {
                const applied = await repo.isApplied(hook.id);
                if (applied)
                    continue;
                Logger.getLogger().info(`Running once-hook: ${hook.id}`, { class: 'MariaDBService' });
                await hook.run();
                await repo.markApplied(hook.id);
            }
            else if (hook.mode === 'always') {
                Logger.getLogger().info(`Running always-hook: ${hook.id}`, { class: 'MariaDBService' });
                await hook.run();
            }
        }
    }
    async start() {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;
        try {
            const tConfig = Config.getInstance().get();
            if (tConfig === null) {
                throw new ServiceError(this.constructor.name, 'Config is null. Check your config file exists!');
            }
            if (tConfig.db && tConfig.db.mysql && !SchemaConfigDbOptionsMySql.validate(tConfig.db.mysql, [])) {
                throw new ServiceError(this.constructor.name, 'Configuration is invalid. Check your config file format and values.');
            }
            if (tConfig.db.mysql === undefined) {
                throw new ServiceError(this.constructor.name, 'Configuration for mysql/mariadb is not set. Check your config file format and values.');
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
        }
        catch (error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;
            this._statusMsg = StringHelper.sprintf('MariaDBService::start: Error while connecting to the MariaDB: %e', error);
            Logger.getLogger().error(this._statusMsg);
            throw error;
        }
        this._statusMsg = '';
        this._status = ServiceStatus.Success;
        this._inProcess = false;
    }
    async stop() {
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