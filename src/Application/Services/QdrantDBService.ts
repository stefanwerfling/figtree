import {ConfigBackendOptions, SchemaConfigDbOptionsQdrant, ServiceImportance, ServiceStatus} from 'figtree-schemas';
import {Config} from '../../Config/Config.js';
import {QdrantDbClient} from '../../Db/QdrantDb/QdrantDbClient.js';
import {Logger} from '../../Logger/Logger.js';
import {ServiceAbstract} from '../../Service/ServiceAbstract.js';
import {ServiceError} from '../../Service/ServiceError.js';
import {StringHelper} from '../../Utils/StringHelper.js';

/**
 * Qdrant Service — brings up the {@link QdrantDbClient} singleton from
 * `config.db.qdrant`, mirroring {@link ChromaDBService}.
 */
export class QdrantDBService extends ServiceAbstract {

    /**
     * Name of qdrant service
     */
    public static NAME = 'qdrant';

    /**
     * Importance
     */
    protected readonly _importance: ServiceImportance = ServiceImportance.Important;

    /**
     * Qdrant client
     * @protected
     */
    protected _qdrantDbClient: QdrantDbClient | null = null;

    /**
     * Constructor
     * @param {string} [serviceName]
     * @param {string[]} [serviceDependencies]
     */
    public constructor(serviceName?: string, serviceDependencies?: string[]) {
        super(serviceName ?? QdrantDBService.NAME, serviceDependencies);
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

            if (tConfig.db && tConfig.db.qdrant && !SchemaConfigDbOptionsQdrant.validate(tConfig.db.qdrant, [])) {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration is invalid. Check your config file format and values.'
                );
            }

            if (tConfig.db.qdrant === undefined) {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration for qdrant is not set. Check your config file format and values.'
                );
            }

            this._qdrantDbClient = QdrantDbClient.getInstance({
                url: tConfig.db.qdrant.url
            });
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;

            this._statusMsg = StringHelper.sprintf(
                'QdrantDBService::start: Error while connecting to the Qdrant: %e',
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
     * Return the qdrant client.
     * @return {QdrantDbClient|null}
     */
    public getClient(): QdrantDbClient | null {
        return this._qdrantDbClient;
    }

    /**
     * Stop the service
     */
    public override async stop(): Promise<void> {
        try {
            this._qdrantDbClient = null;
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('QdrantDBService::stop: Error stopping the Qdrant: %e', error);

            Logger.getLogger().error(this._statusMsg);
        } finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }

}