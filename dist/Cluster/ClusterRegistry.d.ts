import { SharedStore } from '../SharedStore/SharedStore.js';
import { ClusterPublishable } from './ClusterPublishable.js';
export type ClusterRegistryOptions = {
    heartbeatMs?: number;
    ttlMs?: number;
};
export declare class ClusterRegistry {
    private static _instance;
    static initialize(store: SharedStore, options?: ClusterRegistryOptions): ClusterRegistry;
    static getInstance(): ClusterRegistry;
    static hasInstance(): boolean;
    static buildKey(namespace: string, workerId: string): string;
    static buildPrefix(namespace: string): string;
    private readonly _store;
    private readonly _heartbeatMs;
    private readonly _ttlMs;
    private readonly _items;
    private _timer;
    private _running;
    constructor(store: SharedStore, options?: ClusterRegistryOptions);
    register(item: ClusterPublishable): void;
    unregister(item: ClusterPublishable): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    queryAll<T = unknown>(namespace: string): Promise<Record<string, T>>;
    queryOwn<T = unknown>(namespace: string): Promise<T | null>;
    private _tick;
}
