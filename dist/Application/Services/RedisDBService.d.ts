import { RedisChannel } from '../../Db/RedisDb/RedisChannel.js';
import { ServiceAbstract, ServiceImportance } from '../../Service/ServiceAbstract.js';
export declare class RedisDBService extends ServiceAbstract {
    protected readonly _importance: ServiceImportance;
    protected _channels: RedisChannel<any>[];
    constructor(channels: RedisChannel<any>[]);
    start(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
}
