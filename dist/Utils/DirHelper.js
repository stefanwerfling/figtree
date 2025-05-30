import { readdir, stat, mkdir } from 'fs/promises';
import * as path from 'path';
export class DirHelper {
    static async getFiles(dir, recursive = false, base = dir) {
        const entries = await readdir(dir, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                return this.getFiles(fullPath, recursive, base);
            }
            else {
                return [path.relative(base, fullPath)];
            }
        }));
        return files.flat();
    }
    static async directoryExist(director) {
        try {
            return (await stat(director)).isDirectory();
        }
        catch (e) {
            return false;
        }
    }
    static async mkdir(director, recursive = false) {
        try {
            await mkdir(director, {
                recursive: recursive
            });
        }
        catch (e) {
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=DirHelper.js.map