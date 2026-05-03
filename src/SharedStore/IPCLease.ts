import {randomUUID} from 'crypto';
import {ClusterLease, ClusterLeaseOptions} from '../Cluster/ClusterLease.js';
import {IPCSharedStore} from './IPCSharedStore.js';

const DEFAULT_TTL_MS = 15_000;

/**
 * IPC-backed distributed lease. Atomic operations are routed to the master
 * process which holds the canonical map.
 */
export class IPCLease extends ClusterLease {

    private readonly _store: IPCSharedStore;
    private readonly _name: string;
    private readonly _ttlMs: number;
    private readonly _nonce: string;

    private _isHolder = false;

    public constructor(store: IPCSharedStore, name: string, options?: ClusterLeaseOptions) {
        super();
        this._store = store;
        this._name = name;
        this._ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
        this._nonce = randomUUID();
    }

    public async acquire(): Promise<boolean> {
        const ok = await this._store._setIfAbsent(this._name, this._nonce, this._ttlMs);
        this._isHolder = ok;

        return ok;
    }

    public async renew(): Promise<boolean> {
        if (!this._isHolder) {
            return false;
        }

        const ok = await this._store._compareAndSet(this._name, this._nonce, this._nonce, this._ttlMs);

        if (!ok) {
            this._isHolder = false;
        }

        return ok;
    }

    public async release(): Promise<boolean> {
        if (!this._isHolder) {
            return false;
        }

        const ok = await this._store._deleteIfEqual(this._name, this._nonce);
        this._isHolder = false;

        return ok;
    }

    public isHolder(): boolean {
        return this._isHolder;
    }

    public getName(): string {
        return this._name;
    }

}