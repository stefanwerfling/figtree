import {Config} from '../../Config/Config.js';
import {ChromaDbClient} from '../../Db/ChromaDb/ChromaDbClient.js';
import {Logger} from '../../Logger/Logger.js';
import {ConfigBackendOptions, SchemaConfigBackendOptions} from '../../Schemas/Config/ConfigBackendOptions.js';
import {SchemaConfigDbOptionsChroma} from '../../Schemas/Config/ConfigDb.js';
import {ServiceAbstract, ServiceImportance, ServiceStatus} from '../../Service/ServiceAbstract.js';
import {ServiceError} from '../../Service/ServiceError.js';
import {StringHelper} from '../../Utils/StringHelper.js';

/**
 * ChromaDB Service
 */
export class ChromaDBService extends ServiceAbstract {

    /**
     * Name of mariadb service
     */
    public static NAME = 'chromadb';

    /**
     * Importance
     */
    protected readonly _importance: ServiceImportance = ServiceImportance.Important;

    /**
     * ChromaDb client
     * @protected
     */
    protected _chromaDbClient: ChromaDbClient|null = null;

    /**
     * Constructor
     * @param {string} serviceName
     * @param {string[]} serviceDependencies
     */
    public constructor(serviceName?: string, serviceDependencies?: string[]) {
        super(serviceName ?? ChromaDBService.NAME, serviceDependencies);
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

            if (tConfig.db && tConfig.db.chroma && !SchemaConfigDbOptionsChroma.validate(tConfig.db.chroma, [])) {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration is invalid. Check your config file format and values.'
                );
            }

            if (tConfig.db.chroma === undefined) {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration for chromadb is not set. Check your config file format and values.'
                );
            }

            this._chromaDbClient = ChromaDbClient.getInstance({
                path: tConfig.db.chroma.url
            });

            await this._chromaDbClient.getClient().init();
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;

            this._statusMsg = StringHelper.sprintf(
                'ChromaDBService::start: Error while connecting to the ChromaDB: %e',
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
     * Return the client from chromadb
     * @return {ChromaDbClient|null}
     */
    public getClient(): ChromaDbClient|null {
        return this._chromaDbClient;
    }

    /**
     * Stop the service
     * @param {boolean} forced
     */
    public override async stop(forced: boolean = false): Promise<void> {
        try {
            this._chromaDbClient = null;
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('ChromaDBService::stop: Error stopping the ChromaDB: %e', error);

            Logger.getLogger().error(this._statusMsg);
        } finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }
}