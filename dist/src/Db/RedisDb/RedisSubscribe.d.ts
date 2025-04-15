import { RedisClient, RedisClientOptions } from './RedisClient.js';
export declare class RedisSubscribe {
    protected static _instance: RedisClient | null;
    static getInstance(options?: RedisClientOptions, createClientInstance?: boolean): RedisClient;
    static hasInstance(): boolean;
}
