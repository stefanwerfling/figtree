import cluster from 'cluster';
import path from 'path';
import { Config } from '../Config/Config.js';
import { FileHelper } from '../Utils/FileHelper.js';
import { BackendCluster } from './BackendCluster.js';
const _readClusterConfig = async (configFile) => {
    let resolved = configFile;
    if (!resolved) {
        const defaultPath = path.join(path.resolve(), `/${Config.DEFAULT_CONFIG_FILE}`);
        if (await FileHelper.fileExist(defaultPath)) {
            resolved = defaultPath;
        }
    }
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
export const bootstrap = async (appFactory, options) => {
    if (!cluster.isPrimary) {
        return {
            start: async () => {
                await appFactory().start();
            }
        };
    }
    const clusterCfg = await _readClusterConfig(options?.configFile);
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