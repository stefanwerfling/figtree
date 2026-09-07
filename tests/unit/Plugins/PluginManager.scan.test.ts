import {describe, it, expect, afterEach} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PluginManager} from '../../../src/Plugins/PluginManager.js';

describe('PluginManager::scan', () => {
    const tmpDirs: string[] = [];

    afterEach(async() => {
        while (tmpDirs.length > 0) {
            const dir = tmpDirs.pop()!;
            await fs.rm(dir, {recursive: true, force: true});
        }
    });

    it('finds a plugin defined by a scoped package (@scope/name) without warning', async() => {
        const appPath = await fs.mkdtemp(path.join(os.tmpdir(), 'figtree-plugins-'));
        tmpDirs.push(appPath);

        const nodeModules = path.join(appPath, 'node_modules');
        const scopedPkg = path.join(nodeModules, '@acme', 'a-plugin');
        await fs.mkdir(scopedPkg, {recursive: true});
        await fs.writeFile(path.join(scopedPkg, 'package.json'), JSON.stringify({
            name: '@acme/a-plugin',
            version: '1.0.0',
            figtree: {
                name: 'A Plugin',
                description: 'A test plugin',
                version: '1.0.0',
                author: 'Test',
                url: 'https://example.com',
                main: 'dist/index.js'
            }
        }));

        // An unscoped, plain dependency with no plugin definition - must be
        // skipped silently rather than throwing/warning.
        const plainPkg = path.join(nodeModules, 'lodash');
        await fs.mkdir(plainPkg, {recursive: true});
        await fs.writeFile(path.join(plainPkg, 'package.json'), JSON.stringify({name: 'lodash', version: '1.0.0'}));

        const manager = new PluginManager('test-service', {appPath});
        const infos = await manager.scan();

        expect(infos).toHaveLength(1);
        expect(infos[0]!.definition.name).toBe('A Plugin');
        expect(infos[0]!.path).toBe(scopedPkg);
    });

});
