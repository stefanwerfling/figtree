import {ClusterSharedStoreType, ConfigBackendOptions} from 'figtree-schemas';
import {ConfigBackend} from '../Config/ConfigBackend.js';
import {RedisClient} from '../Db/RedisDb/RedisClient.js';
import {Logger} from '../Logger/Logger.js';
import {IPCSharedStore} from '../SharedStore/IPCSharedStore.js';
import {RedisSharedStore} from '../SharedStore/RedisSharedStore.js';
import {SharedStore} from '../SharedStore/SharedStore.js';
import {ClusterRegistry, ClusterRegistryOptions} from './ClusterRegistry.js';

/**
 * Options for `setupClusterRegistryFromConfig`.
 */
export type SetupClusterRegistryOptions = {
    /**
     * Existing RedisClient to use for the Redis-backed SharedStore. Required
     * when `cluster.sharedStore.type === 'redis'` AND no RedisClient singleton
     * has been initialized yet.
     */
    redisClient?: RedisClient;
    /**
     * Override the heartbeat / TTL options of the resulting ClusterRegistry.
     */
    registry?: ClusterRegistryOptions;
};

/**
 * Result of a successful setup.
 */
export type SetupClusterRegistryResult = {
    store: SharedStore;
    registry: ClusterRegistry;
};

/**
 * Auto-wire a `SharedStore` and the `ClusterRegistry` singleton from the
 * `cluster` block of the loaded config.
 *
 * - Reads `Config.getInstance().get().cluster.sharedStore` to decide between
 *   `IPCSharedStore` and `RedisSharedStore`.
 * - Initializes the store (calls `init()`).
 * - Initializes the `ClusterRegistry` singleton.
 * - Returns the store + registry so the caller can keep references.
 *
 * Returns `null` when:
 * - `cluster.enabled !== true`, or
 * - `cluster.sharedStore` is missing.
 *
 * Call this from `BackendApp._initServices()` BEFORE adding services that
 * should appear in the cluster-wide registry. `BackendApp.start()` will
 * automatically register the `ServiceManager` and start the heartbeat after
 * services are up.
 *
 * @example
 *   protected override async _initServices(): Promise<void> {
 *       await setupClusterRegistryFromConfig();
 *
 *       this._serviceManager.add(new MariaDBService());
 *       this._serviceManager.add(new HttpService(), ['http']);
 *   }
 *
 * @param {SetupClusterRegistryOptions} options
 * @return {SetupClusterRegistryResult|null}
 */
export const setupClusterRegistryFromConfig = async(
    options?: SetupClusterRegistryOptions
): Promise<SetupClusterRegistryResult | null> => {
    const config = ConfigBackend.getInstance().get() as ConfigBackendOptions | null;
    const clusterCfg = config?.cluster;

    if (!clusterCfg || !clusterCfg.enabled) {
        return null;
    }

    const sharedStoreCfg = clusterCfg.sharedStore;

    if (!sharedStoreCfg) {
        Logger.getLogger().warn?.(
            'setupClusterRegistryFromConfig: cluster.enabled=true but cluster.sharedStore is missing — skipping.'
        );
        return null;
    }

    let store: SharedStore;

    switch (sharedStoreCfg.type) {
        case ClusterSharedStoreType.Redis: {
            const client = options?.redisClient ?? (RedisClient.hasInstance() ? RedisClient.getInstance() : null);

            if (!client) {
                throw new Error(
                    'setupClusterRegistryFromConfig: sharedStore.type=redis but no RedisClient is available. ' +
                    'Initialize RedisClient.getInstance(options) first or pass it via options.redisClient.'
                );
            }

            store = new RedisSharedStore(client, sharedStoreCfg.namespace);
            break;
        }

        case ClusterSharedStoreType.IPC:
            store = new IPCSharedStore();
            break;

        default:
            Logger.getLogger().warn?.(
                `setupClusterRegistryFromConfig: unknown sharedStore.type='${String(sharedStoreCfg.type)}', skipping.`
            );
            return null;
    }

    await store.init();

    const registry = ClusterRegistry.initialize(store, options?.registry);

    return { store: store, registry: registry };
};