import cluster from 'cluster';
import path from 'path';
import { ClusterSharedStoreType, ENV_CLUSTER, SchemaDefaultArgs } from 'figtree-schemas';
import { Config } from '../Config/Config.js';
import { Args } from '../Env/Args.js';
import { FileHelper } from '../Utils/FileHelper.js';
import { BackendCluster } from './BackendCluster.js';
const _resolveConfigPath = async (explicit) => {
    if (explicit) {
        return explicit;
    }
    try {
        const args = Args.get(SchemaDefaultArgs);
        if (args.config) {
            return args.config;
        }
    }
    catch {
    }
    const defaultPath = path.join(path.resolve(), `/${Config.DEFAULT_CONFIG_FILE}`);
    if (await FileHelper.fileExist(defaultPath)) {
        return defaultPath;
    }
    return null;
};
const _readClusterConfigFile = async (resolved) => {
    if (!resolved) {
        return null;
    }
    try {
        if (!await FileHelper.fileExist(resolved)) {
            return null;
        }
        const raw = await FileHelper.fileRead(resolved);
        const parsed = JSON.parse(raw);
        return parsed.cluster ?? null;
    }
    catch {
        return null;
    }
};
const _applyClusterEnv = (base) => {
    const hasAny = [
        ENV_CLUSTER.CLUSTER_ENABLED,
        ENV_CLUSTER.CLUSTER_WORKERS,
        ENV_CLUSTER.CLUSTER_SHUTDOWN_TIMEOUT_MS,
        ENV_CLUSTER.CLUSTER_SHARED_STORE_TYPE,
        ENV_CLUSTER.CLUSTER_SHARED_STORE_NAMESPACE
    ].some((k) => process.env[k]);
    if (!hasAny) {
        return base;
    }
    const out = base ? { ...base } : {};
    const enabled = process.env[ENV_CLUSTER.CLUSTER_ENABLED];
    if (enabled !== undefined) {
        out.enabled = enabled === '1' || enabled.toLowerCase() === 'true';
    }
    const workers = process.env[ENV_CLUSTER.CLUSTER_WORKERS];
    if (workers !== undefined) {
        const n = parseInt(workers, 10);
        if (!Number.isNaN(n) && n > 0) {
            out.workers = n;
        }
    }
    const shutdownMs = process.env[ENV_CLUSTER.CLUSTER_SHUTDOWN_TIMEOUT_MS];
    if (shutdownMs !== undefined) {
        const n = parseInt(shutdownMs, 10);
        if (!Number.isNaN(n) && n > 0) {
            out.shutdownTimeoutMs = n;
        }
    }
    const storeType = process.env[ENV_CLUSTER.CLUSTER_SHARED_STORE_TYPE];
    const storeNs = process.env[ENV_CLUSTER.CLUSTER_SHARED_STORE_NAMESPACE];
    if (storeType !== undefined || storeNs !== undefined) {
        const validType = storeType === ClusterSharedStoreType.IPC || storeType === ClusterSharedStoreType.Redis
            ? storeType
            : out.sharedStore?.type ?? ClusterSharedStoreType.IPC;
        out.sharedStore = {
            type: validType,
            namespace: storeNs ?? out.sharedStore?.namespace
        };
    }
    return out;
};
export const bootstrap = async (appFactory, options) => {
    if (!cluster.isPrimary) {
        return {
            start: async () => {
                await appFactory().start();
            }
        };
    }
    const configPath = await _resolveConfigPath(options?.configFile);
    const fromFile = await _readClusterConfigFile(configPath);
    const clusterCfg = _applyClusterEnv(fromFile);
    if (clusterCfg?.enabled) {
        return new BackendCluster({
            appFactory: appFactory,
            workers: clusterCfg.workers,
            roles: clusterCfg.roles,
            shutdownTimeoutMs: clusterCfg.shutdownTimeoutMs,
            shutdownSignals: clusterCfg.shutdownSignals,
            respawn: clusterCfg.respawn
        });
    }
    return {
        start: async () => {
            await appFactory().start();
        }
    };
};
//# sourceMappingURL=bootstrap.js.map