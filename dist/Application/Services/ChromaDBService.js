import { Config } from '../../Config/Config.js';
import { ChromaDbClient } from '../../Db/ChromaDb/ChromaDbClient.js';
import { Logger } from '../../Logger/Logger.js';
import { SchemaConfigBackendOptions } from '../../Schemas/Config/ConfigBackendOptions.js';
import { ServiceAbstract, ServiceImportance, ServiceStatus } from '../../Service/ServiceAbstract.js';
import { ServiceError } from '../../Service/ServiceError.js';
import { StringHelper } from '../../Utils/StringHelper.js';
export class ChromaDBService extends ServiceAbstract {
    static NAME = 'chromadb';
    _importance = ServiceImportance.Important;
    _chromaDbClient = null;
    constructor(serviceName, serviceDependencies) {
        super(serviceName ?? ChromaDBService.NAME, serviceDependencies);
    }
    async start() {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;
        try {
            const tConfig = Config.getInstance().get();
            if (tConfig === null) {
                throw new ServiceError(this.constructor.name, 'Config is null. Check your config file exists!');
            }
            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                throw new ServiceError(this.constructor.name, 'Configuration is invalid. Check your config file format and values.');
            }
            if (tConfig.db.chroma === undefined) {
                throw new ServiceError(this.constructor.name, 'Configuration for chromadb is not set. Check your config file format and values.');
            }
            this._chromaDbClient = ChromaDbClient.getInstance({
                path: tConfig.db.chroma.url
            });
            await this._chromaDbClient.getClient().init();
        }
        catch (error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;
            this._statusMsg = StringHelper.sprintf('ChromaDBService::start: Error while connecting to the ChromaDB: %e', error);
            Logger.getLogger().error(this._statusMsg);
            throw error;
        }
        this._statusMsg = '';
        this._status = ServiceStatus.Success;
        this._inProcess = false;
    }
    getClient() {
        return this._chromaDbClient;
    }
    async stop(forced = false) {
        try {
            this._chromaDbClient = null;
        }
        catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('ChromaDBService::stop: Error stopping the ChromaDB: %e', error);
            Logger.getLogger().error(this._statusMsg);
        }
        finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }
}
//# sourceMappingURL=ChromaDBService.js.map