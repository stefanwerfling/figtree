import { RedisClientType } from 'redis';
import { RedisChannel } from './RedisChannel.js';
export type RedisClientOptions = {
    url: string;
    password?: string;
};
export type FunChannelCallback = (message: string) => Promise<void>;
export declare class RedisClient {
    protected static _instance: RedisClient | null;
    static getInstance(options?: RedisClientOptions): RedisClient;
    static hasInstance(): boolean;
    protected _client: RedisClientType;
    protected _isConnect: boolean;
    constructor(options: RedisClientOptions);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    protected _registerChannel(channel: string, callback: FunChannelCallback): Promise<void>;
    registerChannels(channels: RedisChannel<any>[]): Promise<void>;
    sendChannel(channel: string, data: string): Promise<void>;
    isConnected(): boolean;
    protected _buildKey(key: string, namespace?: string): string;
    get<T = any>(key: string, namespace?: string): Promise<T | null>;
    set<T = any>(key: string, value: T, namespace?: string): Promise<void>;
    delete(key: string, namespace?: string): Promise<void>;
    unlink(key: string, namespace?: string): Promise<void>;
    has(key: string, namespace?: string): Promise<boolean>;
    clearAll(): Promise<void>;
    clearNamespace(namespace: string): Promise<void>;
}
