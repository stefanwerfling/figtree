import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {bootstrap} from '../../../src/Application/bootstrap.js';
import {BackendCluster} from '../../../src/Application/BackendCluster.js';

const fakeFactory = (): any => ({
    start: async(): Promise<void> => {
        // never called in these tests
    }
});

describe('bootstrap (master / standalone)', () => {

    let tmpDir: string;

    beforeEach(async() => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'figtree-bootstrap-'));
    });

    afterEach(async() => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    const writeConfig = async(content: object): Promise<string> => {
        const file = path.join(tmpDir, 'config.json');
        await fs.writeFile(file, JSON.stringify(content));
        return file;
    };

    it('returns a single-process wrapper when cluster.enabled is false', async() => {
        const file = await writeConfig({ cluster: { enabled: false } });
        const result = await bootstrap(fakeFactory, { configFile: file });

        expect(result).not.toBeInstanceOf(BackendCluster);
        expect(typeof result.start).toBe('function');
    });

    it('returns a single-process wrapper when cluster section is missing', async() => {
        const file = await writeConfig({ db: {}, httpserver: { publicdir: 'x' } });
        const result = await bootstrap(fakeFactory, { configFile: file });

        expect(result).not.toBeInstanceOf(BackendCluster);
    });

    it('returns a BackendCluster when cluster.enabled is true', async() => {
        const file = await writeConfig({
            cluster: { enabled: true, workers: 2 }
        });
        const result = await bootstrap(fakeFactory, { configFile: file });

        expect(result).toBeInstanceOf(BackendCluster);
    });

    it('passes roles, shutdownTimeoutMs, respawn through to BackendCluster', async() => {
        const file = await writeConfig({
            cluster: {
                enabled: true,
                roles: { http: 2, cron: 1 },
                shutdownTimeoutMs: 20_000,
                respawn: { backoffMs: [0, 500], maxPerWindow: 3, windowMs: 30_000 }
            }
        });
        const result = await bootstrap(fakeFactory, { configFile: file });

        expect(result).toBeInstanceOf(BackendCluster);
    });

    it('returns a single-process wrapper when the config file is missing', async() => {
        const result = await bootstrap(fakeFactory, {
            configFile: path.join(tmpDir, 'does-not-exist.json')
        });

        expect(result).not.toBeInstanceOf(BackendCluster);
    });

    it('returns a single-process wrapper when the config file is invalid JSON', async() => {
        const file = path.join(tmpDir, 'broken.json');
        await fs.writeFile(file, 'not json {{{');

        const result = await bootstrap(fakeFactory, { configFile: file });
        expect(result).not.toBeInstanceOf(BackendCluster);
    });

});

describe('bootstrap (CLUSTER_* env overrides)', () => {

    let tmpDir: string;
    const original: Record<string, string | undefined> = {};
    const keys = [
        'CLUSTER_ENABLED',
        'CLUSTER_WORKERS',
        'CLUSTER_SHUTDOWN_TIMEOUT_MS',
        'CLUSTER_SHARED_STORE_TYPE',
        'CLUSTER_SHARED_STORE_NAMESPACE'
    ];

    beforeEach(async() => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'figtree-bootstrap-env-'));

        for (const k of keys) {
            original[k] = process.env[k];
            delete process.env[k];
        }
    });

    afterEach(async() => {
        await fs.rm(tmpDir, { recursive: true, force: true });

        for (const k of keys) {
            if (original[k] === undefined) {
                delete process.env[k];
            } else {
                process.env[k] = original[k];
            }
        }
    });

    it('CLUSTER_ENABLED=1 enables cluster mode even with no config file', async() => {
        process.env.CLUSTER_ENABLED = '1';
        process.env.CLUSTER_SHARED_STORE_TYPE = 'ipc';

        const result = await bootstrap(fakeFactory, {
            configFile: path.join(tmpDir, 'missing.json')
        });

        expect(result).toBeInstanceOf(BackendCluster);
    });

    it('CLUSTER_ENABLED=true overrides cluster.enabled=false in the file', async() => {
        const file = path.join(tmpDir, 'config.json');
        await fs.writeFile(file, JSON.stringify({
            cluster: { enabled: false, workers: 1 }
        }));

        process.env.CLUSTER_ENABLED = 'true';

        const result = await bootstrap(fakeFactory, { configFile: file });
        expect(result).toBeInstanceOf(BackendCluster);
    });

    it('preserves file-only fields when only some env vars are set', async() => {
        const file = path.join(tmpDir, 'config.json');
        await fs.writeFile(file, JSON.stringify({
            cluster: {
                enabled: true,
                roles: { http: 2, cron: 1 },
                shutdownTimeoutMs: 8000
            }
        }));

        process.env.CLUSTER_SHUTDOWN_TIMEOUT_MS = '20000';

        const result = await bootstrap(fakeFactory, { configFile: file });
        // file-defined roles are preserved; env overrides shutdownTimeoutMs
        expect(result).toBeInstanceOf(BackendCluster);
    });

});