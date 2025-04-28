import { Config } from '../../Config/Config.js';
import { RedisClient } from '../../Db/RedisDb/RedisClient.js';
import { RedisSubscribe } from '../../Db/RedisDb/RedisSubscribe.js';
import { Logger } from '../../Logger/Logger.js';
import { SchemaConfigBackendOptions } from '../../Schemas/Config/ConfigBackendOptions.js';
import { ServiceAbstract, ServiceStatus } from '../../Service/ServiceAbstract.js';
import { StringHelper } from '../../Utils/StringHelper.js';
export class RedisDBService extends ServiceAbstract {
    _channels;
    constructor(channels) {
        super();
        this._channels = channels;
    }
    async start() {
        this._status = ServiceStatus.Progress;
        try {
            const tConfig = Config.getInstance().get();
            if (tConfig === null) {
                this._status = ServiceStatus.Error;
                this._statusMsg = 'RedisDBService::start: Error while connecting to the RedisDB, check your config file exist!';
                Logger.getLogger().error(this._statusMsg);
                this._inProcess = false;
                return;
            }
            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                this._status = ServiceStatus.Error;
                this._statusMsg = 'RedisDBService::start: Error while connecting to the RedisDB, check your config is correct setup!';
                Logger.getLogger().error(this._statusMsg);
                this._inProcess = false;
                return;
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
            }
            else {
                this._status = ServiceStatus.Error;
                this._statusMsg = 'RedisDBService::start: Error while connecting to the RedisDB, check your config is empty!';
                Logger.getLogger().error(this._statusMsg);
                this._inProcess = false;
                return;
            }
        }
        catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('RedisDBService::start: Error while connecting to the RedisDB: %e', error);
            Logger.getLogger().error(this._statusMsg);
            this._inProcess = false;
            return;
        }
        this._status = ServiceStatus.Success;
        this._inProcess = true;
    }
    async stop(forced = false) {
        try {
            await RedisClient.getInstance().disconnect();
        }
        catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('RedisDBService::stop: Error stopping the RedisDB: %e', error);
            Logger.getLogger().error(this._statusMsg);
        }
        finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }
}
//# sourceMappingURL=RedisDBService.js.map