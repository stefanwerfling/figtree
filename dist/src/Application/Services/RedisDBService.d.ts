import { RedisChannel } from '../../Db/RedisDb/RedisChannel.js';
import { ServiceAbstract } from '../../Service/ServiceAbstract.js';
export declare class RedisDBService extends ServiceAbstract {
    protected _channels: RedisChannel<any>[];
    constructor(channels: RedisChannel<any>[]);
    start(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
}
