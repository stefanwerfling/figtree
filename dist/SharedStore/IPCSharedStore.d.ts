import { SharedStore, SharedStoreSubscriber } from './SharedStore.js';
export declare class IPCSharedStore extends SharedStore {
    private _store;
    private _subscribers;
    init(): Promise<void>;
    private _handlePrimaryMessage;
    private _sendAndWait;
    get<T = any>(key: string): Promise<T | undefined>;
    set<T = any>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
    clear(): Promise<void>;
    publish<T = any>(channel: string, message: T): Promise<void>;
    subscribe<T = any>(channel: string, callback: SharedStoreSubscriber<T>): Promise<void>;
    unsubscribe<T = any>(channel: string, callback?: SharedStoreSubscriber<T>): Promise<void>;
    private _fanOutPublish;
    private _dispatchLocalSubscribers;
}
