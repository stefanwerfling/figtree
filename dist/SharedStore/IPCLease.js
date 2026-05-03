import { randomUUID } from 'crypto';
import { ClusterLease } from '../Cluster/ClusterLease.js';
const DEFAULT_TTL_MS = 15_000;
export class IPCLease extends ClusterLease {
    _store;
    _name;
    _ttlMs;
    _nonce;
    _isHolder = false;
    constructor(store, name, options) {
        super();
        this._store = store;
        this._name = name;
        this._ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
        this._nonce = randomUUID();
    }
    async acquire() {
        const ok = await this._store._setIfAbsent(this._name, this._nonce, this._ttlMs);
        this._isHolder = ok;
        return ok;
    }
    async renew() {
        if (!this._isHolder) {
            return false;
        }
        const ok = await this._store._compareAndSet(this._name, this._nonce, this._nonce, this._ttlMs);
        if (!ok) {
            this._isHolder = false;
        }
        return ok;
    }
    async release() {
        if (!this._isHolder) {
            return false;
        }
        const ok = await this._store._deleteIfEqual(this._name, this._nonce);
        this._isHolder = false;
        return ok;
    }
    isHolder() {
        return this._isHolder;
    }
    getName() {
        return this._name;
    }
}
//# sourceMappingURL=IPCLease.js.map