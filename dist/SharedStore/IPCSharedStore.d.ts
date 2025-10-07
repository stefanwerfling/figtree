import { SharedStore } from './SharedStore.js';
export declare class IPCSharedStore extends SharedStore {
    private _store;
    init(): Promise<void>;
    private _sendAndWait;
    get<T = any>(key: string): Promise<T | undefined>;
    set<T = any>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
    clear(): Promise<void>;
}
