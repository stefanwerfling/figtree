import {describe, it, expect, afterEach} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Logger} from '../../../src/Logger/Logger.js';

describe('Logger::cleanLogfiles', () => {
    const tmpDirs: string[] = [];

    afterEach(async() => {
        while (tmpDirs.length > 0) {
            const dir = tmpDirs.pop()!;
            await fs.rm(dir, {recursive: true, force: true});
        }
    });

    it('resolves without throwing when the log directory does not exist yet', async() => {
        const missingDir = path.join(os.tmpdir(), 'figtree-logs-does-not-exist-' + Date.now());

        await expect(Logger.cleanLogfiles(missingDir, 14)).resolves.toBeUndefined();
    });

    it('still cleans an existing directory as before', async() => {
        const logDir = await fs.mkdtemp(path.join(os.tmpdir(), 'figtree-logs-'));
        tmpDirs.push(logDir);

        const filePath = path.join(logDir, 'app.log');
        await fs.writeFile(filePath, 'hello');

        await expect(Logger.cleanLogfiles(logDir, 14)).resolves.toBeUndefined();
        // Fresh file, well within maxDays - must not have been deleted.
        await expect(fs.stat(filePath)).resolves.toBeTruthy();
    });

});
