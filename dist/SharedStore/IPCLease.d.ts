import { ClusterLease, ClusterLeaseOptions } from '../Cluster/ClusterLease.js';
import { IPCSharedStore } from './IPCSharedStore.js';
export declare class IPCLease extends ClusterLease {
    private readonly _store;
    private readonly _name;
    private readonly _ttlMs;
    private readonly _nonce;
    private _isHolder;
    constructor(store: IPCSharedStore, name: string, options?: ClusterLeaseOptions);
    acquire(): Promise<boolean>;
    renew(): Promise<boolean>;
    release(): Promise<boolean>;
    isHolder(): boolean;
    getName(): string;
}
