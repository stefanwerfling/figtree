import {randomUUID} from 'crypto';
import {ClusterLease, ClusterLeaseOptions} from '../Cluster/ClusterLease.js';
import {RedisClient} from '../Db/RedisDb/RedisClient.js';

const DEFAULT_TTL_MS = 15_000;

/**
 * Redis-backed distributed lease. Atomic via Redis primitives + tiny Lua
 * scripts for renew (compare-and-set) and release (compare-and-delete).
 */
export class RedisLease extends ClusterLease {

    private readonly _client: RedisClient;
    private readonly _namespace: string;
    private readonly _name: string;
    private readonly _ttlMs: number;
    private readonly _nonce: string;

    private _isHolder = false;

    public constructor(
        client: RedisClient,
        namespace: string,
        name: string,
        options?: ClusterLeaseOptions
    ) {
        super();
        this._client = client;
        this._namespace = namespace;
        this._name = name;
        this._ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
        this._nonce = randomUUID();
    }

    public async acquire(): Promise<boolean> {
        const ok = await this._client.setIfAbsent(this._name, this._nonce, this._namespace, this._ttlMs);
        this._isHolder = ok;

        return ok;
    }

    public async renew(): Promise<boolean> {
        if (!this._isHolder) {
            return false;
        }

        const ok = await this._client.compareAndSet(
            this._name,
            this._nonce,
            this._nonce,
            this._namespace,
            this._ttlMs
        );

        if (!ok) {
            this._isHolder = false;
        }

        return ok;
    }

    public async release(): Promise<boolean> {
        if (!this._isHolder) {
            return false;
        }

        const ok = await this._client.deleteIfEqual(this._name, this._nonce, this._namespace);
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