import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {setupClusterRegistryFromConfig} from '../../../src/Cluster/setupClusterRegistry.js';
import {ClusterRegistry} from '../../../src/Cluster/ClusterRegistry.js';
import {IPCSharedStore} from '../../../src/SharedStore/IPCSharedStore.js';
import {ConfigBackend} from '../../../src/Config/ConfigBackend.js';

/**
 * setupClusterRegistryFromConfig reads ConfigBackend.getInstance().get().
 * The tests below populate the singleton manually and reset it after each
 * test so we don't leak state across test files.
 */
describe('setupClusterRegistryFromConfig', () => {

    let originalConfig: any;
    let originalRegistryHasInstance: boolean;

    beforeEach(() => {
        originalConfig = ConfigBackend.getInstance().get();
        originalRegistryHasInstance = ClusterRegistry.hasInstance();
        // ensure a clean registry slot for this test
        (ClusterRegistry as any)._instance = null;
    });

    afterEach(async() => {
        if (ClusterRegistry.hasInstance()) {
            await ClusterRegistry.getInstance().stop();
        }

        // restore original singleton state
        (ClusterRegistry as any)._instance = originalRegistryHasInstance ? (ClusterRegistry as any)._instance : null;
        ConfigBackend.getInstance().set(originalConfig);
    });

    it('returns null when config has no cluster block', async() => {
        ConfigBackend.getInstance().set({ db: {}, httpserver: { publicdir: 'x' } } as any);

        const result = await setupClusterRegistryFromConfig();
        expect(result).toBeNull();
        expect(ClusterRegistry.hasInstance()).toBe(false);
    });

    it('returns null when cluster.enabled is false', async() => {
        ConfigBackend.getInstance().set({
            db: {}, httpserver: { publicdir: 'x' },
            cluster: { enabled: false }
        } as any);

        const result = await setupClusterRegistryFromConfig();
        expect(result).toBeNull();
    });

    it('returns null when sharedStore is missing despite enabled=true', async() => {
        ConfigBackend.getInstance().set({
            db: {}, httpserver: { publicdir: 'x' },
            cluster: { enabled: true }
        } as any);

        const result = await setupClusterRegistryFromConfig();
        expect(result).toBeNull();
    });

    it('builds an IPCSharedStore + ClusterRegistry when sharedStore.type=ipc', async() => {
        ConfigBackend.getInstance().set({
            db: {}, httpserver: { publicdir: 'x' },
            cluster: {
                enabled: true,
                sharedStore: { type: 'ipc' }
            }
        } as any);

        const result = await setupClusterRegistryFromConfig();

        expect(result).not.toBeNull();
        expect(result!.store).toBeInstanceOf(IPCSharedStore);
        expect(result!.registry).toBeInstanceOf(ClusterRegistry);
        expect(ClusterRegistry.hasInstance()).toBe(true);
    });

    it('throws when sharedStore.type=redis but no RedisClient is available', async() => {
        ConfigBackend.getInstance().set({
            db: {}, httpserver: { publicdir: 'x' },
            cluster: {
                enabled: true,
                sharedStore: { type: 'redis' }
            }
        } as any);

        await expect(setupClusterRegistryFromConfig()).rejects.toThrow(/RedisClient/u);
    });

});