import { ClusterSharedStoreType } from 'figtree-schemas';
import { ConfigBackend } from '../Config/ConfigBackend.js';
import { RedisClient } from '../Db/RedisDb/RedisClient.js';
import { Logger } from '../Logger/Logger.js';
import { IPCSharedStore } from '../SharedStore/IPCSharedStore.js';
import { RedisSharedStore } from '../SharedStore/RedisSharedStore.js';
import { ClusterRegistry } from './ClusterRegistry.js';
export const setupClusterRegistryFromConfig = async (options) => {
    const config = ConfigBackend.getInstance().get();
    const clusterCfg = config?.cluster;
    if (!clusterCfg || !clusterCfg.enabled) {
        return null;
    }
    const sharedStoreCfg = clusterCfg.sharedStore;
    if (!sharedStoreCfg) {
        Logger.getLogger().warn?.('setupClusterRegistryFromConfig: cluster.enabled=true but cluster.sharedStore is missing — skipping.');
        return null;
    }
    let store;
    switch (sharedStoreCfg.type) {
        case ClusterSharedStoreType.Redis: {
            const client = options?.redisClient ?? (RedisClient.hasInstance() ? RedisClient.getInstance() : null);
            if (!client) {
                throw new Error('setupClusterRegistryFromConfig: sharedStore.type=redis but no RedisClient is available. ' +
                    'Initialize RedisClient.getInstance(options) first or pass it via options.redisClient.');
            }
            store = new RedisSharedStore(client, sharedStoreCfg.namespace);
            break;
        }
        case ClusterSharedStoreType.IPC:
            store = new IPCSharedStore();
            break;
        default:
            Logger.getLogger().warn?.(`setupClusterRegistryFromConfig: unknown sharedStore.type='${String(sharedStoreCfg.type)}', skipping.`);
            return null;
    }
    await store.init();
    const registry = ClusterRegistry.initialize(store, options?.registry);
    return { store: store, registry: registry };
};
//# sourceMappingURL=setupClusterRegistry.js.map