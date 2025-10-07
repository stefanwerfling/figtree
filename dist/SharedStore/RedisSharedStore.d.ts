import { RedisClient } from '../Db/RedisDb/RedisClient.js';
import { SharedStore } from './SharedStore.js';
export declare class RedisSharedStore extends SharedStore {
    private readonly _client;
    private readonly _namespace;
    constructor(client?: RedisClient, namespace?: string);
    init(): Promise<void>;
    get<T = any>(key: string): Promise<T | undefined>;
    set<T = any>(key: string, value: T): Promise<void>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
