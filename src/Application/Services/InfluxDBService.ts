import {Config} from '../../Config/Config.js';
import {InfluxDbHelper} from '../../Db/InfluxDb/InfluxDbHelper.js';
import {Logger} from '../../Logger/Logger.js';
import {SchemaConfigBackendOptions} from '../../Schemas/Config/ConfigBackendOptions.js';
import {ServiceAbstract, ServiceStatus} from '../../Service/ServiceAbstract.js';
import {StringHelper} from '../../Utils/StringHelper.js';

/**
 * Influx DB Service
 */
export class InfluxDBService extends ServiceAbstract {

    /**
     * Start the service
     */
    public override async start(): Promise<void> {
        try {
            const tConfig = Config.getInstance().get();

            if (tConfig === null) {
                this._status = ServiceStatus.Error;
                this._statusMsg = 'InfluxDBService::start: Error while connecting to the InfluxDB, check your config file exist!';

                Logger.getLogger().error(this._statusMsg);

                this._inProcess = false;
                return;
            }

            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                this._status = ServiceStatus.Error;
                this._statusMsg = 'InfluxDBService::start: Error while connecting to the InfluxDB, check your config is correct setup!';

                Logger.getLogger().error(this._statusMsg);

                this._inProcess = false;
                return;
            }

            if (tConfig.db.influx) {
                await InfluxDbHelper.init({
                    url: tConfig.db.influx.url,
                    token: tConfig.db.influx.token,
                    org: tConfig.db.influx.org,
                    bucket: tConfig.db.influx.bucket
                });
            }
        } catch(error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('InfluxDBService::start: Error while connecting to the InfluxDB: %e', error);

            Logger.getLogger().error(this._statusMsg);

            this._inProcess = false;
            return;
        }

        this._status = ServiceStatus.Success;
        this._inProcess = true;
    }

    /**
     * Stop the service
     * @param {boolean} forced
     */
    public override async stop(forced: boolean = false): Promise<void> {
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