import cluster from 'cluster';
import path from 'path';
import {ClusterSharedStoreType, ConfigCluster, ENV_CLUSTER, SchemaDefaultArgs} from 'figtree-schemas';
import {Config} from '../Config/Config.js';
import {Args} from '../Env/Args.js';
import {FileHelper} from '../Utils/FileHelper.js';
import {BackendApp} from './BackendApp.js';
import {BackendCluster} from './BackendCluster.js';

/**
 * Bootstrap options.
 */
export type BootstrapOptions = {
    /**
     * Path to the config file. Overrides the `--config=` CLI flag and the
     * default `./config.json` lookup.
     */
    configFile?: string;
};

/**
 * Anything that can be `start()`ed — either a `BackendCluster` or a thin
 * standalone wrapper around a `BackendApp`.
 */
export type BootstrapResult = {
    start(): Promise<void>;
};

/**
 * Resolve which config file to read, in this order:
 * 1. `options.configFile`
 * 2. `--config=<path>` from the CLI
 * 3. `./config.json` in the current working directory (if it exists)
 *
 * @param {string} explicit
 * @return {string|null}
 * @private
 */
const _resolveConfigPath = async(explicit?: string): Promise<string | null> => {
    if (explicit) {
        return explicit;
    }

    try {
        const args = Args.get(SchemaDefaultArgs);

        if (args.config) {
            return args.config;
        }
    } catch {
        // Args.get may exit on validation errors; ignore here so bootstrap
        // can still fall back to the default lookup.
    }

    const defaultPath = path.join(path.resolve(), `/${Config.DEFAULT_CONFIG_FILE}`);

    if (await FileHelper.fileExist(defaultPath)) {
        return defaultPath;
    }

    return null;
};

/**
 * Read just the `cluster` block from the config file. Returns null if the
 * file is missing, unreadable, contains no cluster section, or fails to
 * parse. Does NOT validate the rest of the config — that is the caller's
 * responsibility (typically the BackendApp's own _loadConfig).
 *
 * @param {string} resolved
 * @return {ConfigCluster|null}
 * @private
 */
const _readClusterConfigFile = async(resolved: string | null): Promise<ConfigCluster | null> => {
    if (!resolved) {
        return null;
    }

    try {
        if (!await FileHelper.fileExist(resolved)) {
            return null;
        }

        const raw = await FileHelper.fileRead(resolved);
        const parsed = JSON.parse(raw) as { cluster?: ConfigCluster; };

        return parsed.cluster ?? null;
    } catch {
        return null;
    }
};

/**
 * Apply CLUSTER_* env variables on top of a cluster block.
 * @param {ConfigCluster|null} base
 * @return {ConfigCluster|null}
 * @private
 */
const _applyClusterEnv = (base: ConfigCluster | null): ConfigCluster | null => {
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

    const out: ConfigCluster = base ? { ...base } : {};

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

/**
 * Inspect the config (master only) and decide whether to launch the
 * backend in cluster mode or single-process mode.
 *
 * Resolution order for the config file:
 * 1. `options.configFile`
 * 2. `--config=<path>` from the CLI (parsed via `Args.get(SchemaDefaultArgs)`)
 * 3. `./config.json` in the current working directory
 *
 * `CLUSTER_*` environment variables are applied on top of the file's `cluster`
 * block, so cluster mode can also be enabled via env vars alone.
 *
 * Workers spawned by `BackendCluster` re-execute the entry script and call
 * `bootstrap()` again — for them this function returns a thin wrapper that
 * just runs `factory().start()`. The actual config validation happens inside
 * `BackendApp.start()`.
 *
 * @example
 *   import { bootstrap } from 'figtree';
 *   import { MyBackend } from './MyBackend.js';
 *
 *   await (await bootstrap(() => new MyBackend())).start();
 *
 * @param {() => BackendApp} appFactory
 * @param {BootstrapOptions} options
 * @return {BootstrapResult}
 */
export const bootstrap = async(
    appFactory: () => BackendApp<any, any>,
    options?: BootstrapOptions
): Promise<BootstrapResult> => {
    if (!cluster.isPrimary) {
        // Forked worker — just run the BackendApp. BackendCluster's worker
        // branch already does the same; this path keeps bootstrap idempotent
        // when the entry script re-executes inside a worker.
        return {
            start: async(): Promise<void> => {
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
            shutdownSignals: clusterCfg.shutdownSignals as NodeJS.Signals[] | undefined,
            respawn: clusterCfg.respawn
        });
    }

    // No cluster section, or `enabled !== true` → run standalone. The
    // BackendApp owns its own config-loading lifecycle.
    return {
        start: async(): Promise<void> => {
            await appFactory().start();
        }
    };
};