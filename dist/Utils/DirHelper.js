import { readdir, stat, mkdir } from 'fs/promises';
export class DirHelper {
    static async getFiles(path) {
        return readdir(path);
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