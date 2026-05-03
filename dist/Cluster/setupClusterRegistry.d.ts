import { RedisClient } from '../Db/RedisDb/RedisClient.js';
import { SharedStore } from '../SharedStore/SharedStore.js';
import { ClusterRegistry, ClusterRegistryOptions } from './ClusterRegistry.js';
export type SetupClusterRegistryOptions = {
    redisClient?: RedisClient;
    registry?: ClusterRegistryOptions;
};
export type SetupClusterRegistryResult = {
    store: SharedStore;
    registry: ClusterRegistry;
};
export declare const setupClusterRegistryFromConfig: (options?: SetupClusterRegistryOptions) => Promise<SetupClusterRegistryResult | null>;
