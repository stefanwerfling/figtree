import { RedisClient } from '../Db/RedisDb/RedisClient.js';
import { SharedStore, SharedStoreSubscriber } from './SharedStore.js';
export declare class RedisSharedStore extends SharedStore {
    private readonly _client;
    private readonly _namespace;
    private _subscriberClient;
    private _subscribers;
    constructor(client?: RedisClient, namespace?: string);
    init(): Promise<void>;
    get<T = any>(key: string): Promise<T | undefined>;
    set<T = any>(key: string, value: T, ttlMs?: number): Promise<void>;
    keys(prefix?: string): Promise<string[]>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    publish<T = any>(channel: string, message: T): Promise<void>;
    subscribe<T = any>(channel: string, callback: SharedStoreSubscriber<T>): Promise<void>;
    unsubscribe<T = any>(channel: string, callback?: SharedStoreSubscriber<T>): Promise<void>;
    private _getSubscriberClient;
    private _namespacedChannel;
    private _dispatchLocalSubscribers;
}
