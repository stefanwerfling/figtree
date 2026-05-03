import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {ConfigBackend} from '../../../src/Config/ConfigBackend.js';

class TestableConfigBackend extends ConfigBackend {

    public callLoadEnvCluster(config: any): any {
        return this._loadEnvCluster(config);
    }

}

describe('ConfigBackend._loadEnvCluster', () => {

    const original: Record<string, string | undefined> = {};
    const keys = [
        'CLUSTER_ENABLED',
        'CLUSTER_WORKERS',
        'CLUSTER_SHUTDOWN_TIMEOUT_MS',
        'CLUSTER_SHARED_STORE_TYPE',
        'CLUSTER_SHARED_STORE_NAMESPACE'
    ];

    beforeEach(() => {
        for (const k of keys) {
            original[k] = process.env[k];
            delete process.env[k];
        }
    });

    afterEach(() => {
        for (const k of keys) {
            if (original[k] === undefined) {
                delete process.env[k];
            } else {
                process.env[k] = original[k];
            }
        }
    });

    const callIt = (cfg: any): any => {
        const cb = new (TestableConfigBackend as any)(undefined);
        return cb.callLoadEnvCluster(cfg);
    };

    it('does not touch the config when no CLUSTER_* env is set', () => {
        const cfg = { db: {}, httpserver: {} };
        const out = callIt(cfg);
        expect(out.cluster).toBeUndefined();
    });

    it('parses CLUSTER_ENABLED=1 as true', () => {
        process.env.CLUSTER_ENABLED = '1';
        const out = callIt({ db: {}, httpserver: {} });
        expect(out.cluster.enabled).toBe(true);
    });

    it('parses CLUSTER_ENABLED=true as true', () => {
        process.env.CLUSTER_ENABLED = 'true';
        const out = callIt({ db: {}, httpserver: {} });
        expect(out.cluster.enabled).toBe(true);
    });

    it('parses CLUSTER_WORKERS as number', () => {
        process.env.CLUSTER_WORKERS = '4';
        const out = callIt({ db: {}, httpserver: {} });
        expect(out.cluster.workers).toBe(4);
    });

    it('ignores CLUSTER_WORKERS when it is not a positive integer', () => {
        process.env.CLUSTER_WORKERS = 'banana';
        const out = callIt({ db: {}, httpserver: {} });
        expect(out.cluster.workers).toBeUndefined();
    });

    it('parses sharedStore.type when CLUSTER_SHARED_STORE_TYPE=redis', () => {
        process.env.CLUSTER_SHARED_STORE_TYPE = 'redis';
        const out = callIt({ db: {}, httpserver: {} });
        expect(out.cluster.sharedStore.type).toBe('redis');
    });

    it('parses sharedStore.namespace', () => {
        process.env.CLUSTER_SHARED_STORE_TYPE = 'ipc';
        process.env.CLUSTER_SHARED_STORE_NAMESPACE = 'myapp';
        const out = callIt({ db: {}, httpserver: {} });
        expect(out.cluster.sharedStore).toEqual({ type: 'ipc', namespace: 'myapp' });
    });

});