import cluster from 'cluster';
import path from 'path';
import {ConfigCluster} from 'figtree-schemas';
import {Config} from '../Config/Config.js';
import {FileHelper} from '../Utils/FileHelper.js';
import {BackendApp} from './BackendApp.js';
import {BackendCluster} from './BackendCluster.js';

/**
 * Bootstrap options.
 */
export type BootstrapOptions = {
    /**
     * Path to the config file. Defaults to `./config.json` in the current
     * working directory if it exists.
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
 * Read just the `cluster` block from the config file. Returns null if the
 * file is missing, unreadable, contains no cluster section, or fails to
 * parse. Does NOT validate the rest of the config — that is the caller's
 * responsibility (typically the BackendApp's own _loadConfig).
 *
 * @param {string} configFile
 * @return {ConfigCluster|null}
 * @private
 */
const _readClusterConfig = async(configFile?: string): Promise<ConfigCluster | null> => {
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
        const parsed = JSON.parse(raw) as { cluster?: ConfigCluster; };

        return parsed.cluster ?? null;
    } catch {
        return null;
    }
};

/**
 * Inspect the config file (master only) and decide whether to launch the
 * backend in cluster mode or single-process mode.
 *
 * Workers spawned by `BackendCluster` re-execute the entry script and call
 * `bootstrap()` again — for them this function returns a thin wrapper that
 * just runs `factory().start()`. The actual config loading happens inside
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

    // Master / standalone — peek at the cluster config to decide.
    const clusterCfg = await _readClusterConfig(options?.configFile);

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