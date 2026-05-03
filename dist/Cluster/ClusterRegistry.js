import { Logger } from '../Logger/Logger.js';
import { BackendCluster } from '../Application/BackendCluster.js';
const DEFAULT_HEARTBEAT_MS = 10_000;
const DEFAULT_TTL_MS = 30_000;
const KEY_PREFIX = 'cluster';
export class ClusterRegistry {
    static _instance = null;
    static initialize(store, options) {
        ClusterRegistry._instance = new ClusterRegistry(store, options);
        return ClusterRegistry._instance;
    }
    static getInstance() {
        if (ClusterRegistry._instance === null) {
            throw new Error('ClusterRegistry::getInstance: not initialized — call initialize(store) first');
        }
        return ClusterRegistry._instance;
    }
    static hasInstance() {
        return ClusterRegistry._instance !== null;
    }
    static buildKey(namespace, workerId) {
        return `${KEY_PREFIX}:${namespace}:${workerId}`;
    }
    static buildPrefix(namespace) {
        return `${KEY_PREFIX}:${namespace}:`;
    }
    _store;
    _heartbeatMs;
    _ttlMs;
    _items = [];
    _timer = null;
    _running = false;
    constructor(store, options) {
        this._store = store;
        this._heartbeatMs = options?.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
        this._ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
    }
    register(item) {
        if (!this._items.includes(item)) {
            this._items.push(item);
        }
    }
    async unregister(item) {
        const index = this._items.indexOf(item);
        if (index >= 0) {
            this._items.splice(index, 1);
        }
        const key = ClusterRegistry.buildKey(item.getNamespace(), BackendCluster.getWorkerId());
        try {
            await this._store.delete(key);
        }
        catch (err) {
            Logger.getLogger().warn?.(`ClusterRegistry::unregister: delete failed for ${key}`, err);
        }
    }
    async start() {
        if (this._running) {
            return;
        }
        this._running = true;
        await this._tick();
        this._timer = setInterval(() => {
            this._tick().catch((err) => {
                Logger.getLogger().error?.('ClusterRegistry::tick error', err);
            });
        }, this._heartbeatMs);
    }
    async stop() {
        if (!this._running) {
            return;
        }
        this._running = false;
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        const workerId = BackendCluster.getWorkerId();
        await Promise.all(this._items.map(async (item) => {
            const key = ClusterRegistry.buildKey(item.getNamespace(), workerId);
            try {
                await this._store.delete(key);
            }
            catch (err) {
                Logger.getLogger().warn?.(`ClusterRegistry::stop: delete failed for ${key}`, err);
            }
        }));
    }
    async queryAll(namespace) {
        const prefix = ClusterRegistry.buildPrefix(namespace);
        const keys = await this._store.keys(prefix);
        const result = {};
        await Promise.all(keys.map(async (key) => {
            const value = await this._store.get(key);
            if (value !== undefined) {
                const workerId = key.substring(prefix.length);
                result[workerId] = value;
            }
        }));
        return result;
    }
    async queryOwn(namespace) {
        const key = ClusterRegistry.buildKey(namespace, BackendCluster.getWorkerId());
        const value = await this._store.get(key);
        return value ?? null;
    }
    async _tick() {
        const workerId = BackendCluster.getWorkerId();
        await Promise.all(this._items.map(async (item) => {
            try {
                const data = await Promise.resolve(item.serialize());
                const key = ClusterRegistry.buildKey(item.getNamespace(), workerId);
                await this._store.set(key, data, this._ttlMs);
            }
            catch (err) {
                Logger.getLogger().error?.(`ClusterRegistry::tick: serialize/set failed for namespace '${item.getNamespace()}'`, err);
            }
        }));
    }
}
//# sourceMappingURL=ClusterRegistry.js.map