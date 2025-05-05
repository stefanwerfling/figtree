import { RedisClient } from './RedisClient.js';
export class RedisSubscribe {
    static _instance = null;
    static getInstance(options, createClientInstance) {
        if (RedisSubscribe._instance === null) {
            if (options) {
                RedisSubscribe._instance = new RedisClient(options);
                if (createClientInstance && !RedisClient.hasInstance()) {
                    RedisClient.getInstance(options);
                }
            }
            else {
                throw new Error('RedisClient::getInstance: Option not set for Regis client init!');
            }
        }
        return RedisSubscribe._instance;
    }
    static hasInstance() {
        return RedisSubscribe._instance !== null;
    }
}
//# sourceMappingURL=RedisSubscribe.js.map