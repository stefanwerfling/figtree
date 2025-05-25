import {Config} from '../../Config/Config.js';
import {RedisChannel} from '../../Db/RedisDb/RedisChannel.js';
import {RedisClient} from '../../Db/RedisDb/RedisClient.js';
import {RedisSubscribe} from '../../Db/RedisDb/RedisSubscribe.js';
import {Logger} from '../../Logger/Logger.js';
import {SchemaConfigBackendOptions} from '../../Schemas/Config/ConfigBackendOptions.js';
import {ServiceAbstract, ServiceImportance, ServiceStatus} from '../../Service/ServiceAbstract.js';
import {ServiceError} from '../../Service/ServiceError.js';
import {StringHelper} from '../../Utils/StringHelper.js';

/**
 * RedisDBService
 */
export class RedisDBService extends ServiceAbstract {

    /**
     * Importance
     */
    protected readonly _importance: ServiceImportance = ServiceImportance.Important;

    /**
     * Redis Channels
     * @protected
     */
    protected _channels: RedisChannel<any>[];

    /**
     * Constructor
     * @param {RedisChannel<any>[]} channels
     * @param {[string]} serviceName
     * @param {[string[]]} serviceDependencies
     */
    public constructor(channels: RedisChannel<any>[], serviceName?: string, serviceDependencies?: string[]) {
        super(serviceName, serviceDependencies);
        this._channels = channels;
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

            if (tConfig.db.redis && tConfig.db.redis.url) {
                const redisSubscribe = RedisSubscribe.getInstance({
                    url: tConfig.db.redis.url,
                    password: tConfig.db.redis.password
                }, true);

                const redisClient = RedisClient.getInstance();
                await redisClient.connect();

                await redisSubscribe.connect();
                await redisSubscribe.registerChannels(this._channels);
            } else {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration is for Redis empty. Check your config file!'
                );
            }
        } catch(error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;

            this._statusMsg = StringHelper.sprintf(
                'RedisDBService::start: Error while connecting to the Redis: %e',
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
            await RedisClient.getInstance().disconnect();
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('RedisDBService::stop: Error stopping the RedisDB: %e', error);

            Logger.getLogger().error(this._statusMsg);
        } finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }
}