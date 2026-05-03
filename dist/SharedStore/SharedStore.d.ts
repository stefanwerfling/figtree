export type SharedStoreSubscriber<T = any> = (message: T) => void | Promise<void>;
export declare abstract class SharedStore {
    abstract init(): Promise<void>;
    abstract get<T = any>(key: string): Promise<T | undefined>;
    abstract set<T = any>(key: string, value: T): Promise<void>;
    abstract delete(key: string): Promise<void>;
    abstract has(key: string): Promise<boolean>;
    abstract clear(): Promise<void>;
    abstract publish<T = any>(channel: string, message: T): Promise<void>;
    abstract subscribe<T = any>(channel: string, callback: SharedStoreSubscriber<T>): Promise<void>;
    abstract unsubscribe<T = any>(channel: string, callback?: SharedStoreSubscriber<T>): Promise<void>;
}
