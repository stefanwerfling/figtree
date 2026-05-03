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