import { ClusterLease, ClusterLeaseOptions } from '../Cluster/ClusterLease.js';
import { RedisClient } from '../Db/RedisDb/RedisClient.js';
export declare class RedisLease extends ClusterLease {
    private readonly _client;
    private readonly _namespace;
    private readonly _name;
    private readonly _ttlMs;
    private readonly _nonce;
    private _isHolder;
    constructor(client: RedisClient, namespace: string, name: string, options?: ClusterLeaseOptions);
    acquire(): Promise<boolean>;
    renew(): Promise<boolean>;
    release(): Promise<boolean>;
    isHolder(): boolean;
    getName(): string;
}
