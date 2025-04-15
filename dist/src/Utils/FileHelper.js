import { stat, rename, unlink, lstat, readFile } from 'fs/promises';
import { Logger } from '../Logger/Logger.js';
export class FileHelper {
    static async isOlderHours(filename, durationHours) {
        let stats;
        try {
            stats = await stat(filename);
        }
        catch (e) {
            return true;
        }
        const fileDate = new Date(stats.mtime);
        const currentDate = new Date();
        return (currentDate.getTime() - fileDate.getTime()) > (durationHours * 60 * 60 * 1000);
    }
    static async fileRead(file, encoding = 'utf-8') {
        return readFile(file, {
            encoding: encoding
        });
    }
    static async fileExist(file, allowLink = false) {
        try {
            if ((await stat(file)).isFile()) {
                return true;
            }
        }
        catch (e) {
            if (Logger.hasLogger()) {
                Logger.getLogger().silly(`FileHelper::fileExist: exception by file: ${file}`, e);
            }
            else {
                console.error(e);
            }
        }
        if (allowLink) {
            try {
                if ((await lstat(file)).isSymbolicLink()) {
                    return true;
                }
            }
            catch (e) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::fileExist: exception by file link: ${file}`, e);
                }
                else {
                    console.error(e);
                }
            }
        }
        return false;
    }
    static async fileSize(file) {
        try {
            return (await stat(file)).size;
        }
        catch (e) {
            return -1;
        }
    }
    static async fileRename(filePath, targetPath) {
        try {
            await rename(filePath, targetPath);
        }
        catch (e) {
            return false;
        }
        return true;
    }
    static async fileDelete(file) {
        try {
            await unlink(file);
        }
        catch (e) {
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=FileHelper.js.map