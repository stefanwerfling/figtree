import {Config} from '../../Config/Config.js';
import {InfluxDbHelper} from '../../Db/InfluxDb/InfluxDbHelper.js';
import {Logger} from '../../Logger/Logger.js';
import {ConfigBackendOptions} from '../../Schemas/Config/ConfigBackendOptions.js';
import {SchemaConfigDbOptionsInflux} from '../../Schemas/Config/ConfigDb.js';
import {ServiceAbstract, ServiceImportance, ServiceStatus} from '../../Service/ServiceAbstract.js';
import {ServiceError} from '../../Service/ServiceError.js';
import {StringHelper} from '../../Utils/StringHelper.js';

/**
 * Influx DB Service
 */
export class InfluxDBService extends ServiceAbstract {

    /**
     * Name of influx service
     */
    public static NAME = 'influx';

    /**
     * Importance
     */
    protected readonly _importance: ServiceImportance = ServiceImportance.Important;

    /**
     * Constructor
     * @param {string} serviceName
     * @param {[string]} serviceName
     * @param {[string[]]} serviceDependencies
     */
    public constructor(serviceName?: string, serviceDependencies?: string[]) {
        super(serviceName ?? InfluxDBService.NAME, serviceDependencies);
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

            if (tConfig.db && tConfig.db.influx && !SchemaConfigDbOptionsInflux.validate(tConfig.db.influx, [])) {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration is invalid. Check your config file format and values.'
                );
            }

            if (tConfig.db.influx) {
                await InfluxDbHelper.init({
                    url: tConfig.db.influx.url,
                    token: tConfig.db.influx.token,
                    org: tConfig.db.influx.org,
                    bucket: tConfig.db.influx.bucket
                });
            } else {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration is for Influx empty. Check your config file!'
                );
            }
        } catch(error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;

            this._statusMsg = StringHelper.sprintf(
                'InfluxDBService::start: Error while connecting to the Influx: %e',
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
            // TODO
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('InfluxDBService::stop: Error stopping the InfluxDB: %e', error);

            Logger.getLogger().error(this._statusMsg);
        } finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }

}