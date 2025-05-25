import { Ets } from 'ets';
import { stat, rename, unlink, readFile, chmod, writeFile, realpath } from 'fs/promises';
import { Logger } from '../Logger/Logger.js';
export class FileHelper {
    static logDebugging = false;
    static async isOlderHours(filename, durationHours) {
        let stats;
        try {
            stats = await stat(filename);
        }
        catch (e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::isOlderHours: exception by file: ${filename}`, e);
                }
                else {
                    console.error(e);
                }
            }
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
    static async fileExist(file, isLink = false, isSocket = false) {
        let fileStat;
        try {
            fileStat = await stat(file);
        }
        catch (e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly('FileHelper::fileExist: exception stat by file: %s', file);
                    Logger.getLogger().silly('FileHelper::fileExist: Trace: %s', Ets.formate(e, true, true));
                }
                else {
                    console.error(e);
                }
            }
            return false;
        }
        if (fileStat.isFile()) {
            return true;
        }
        if (isLink && fileStat.isSymbolicLink()) {
            return true;
        }
        return isSocket && fileStat.isSocket();
    }
    static async fileSize(file) {
        try {
            return (await stat(file)).size;
        }
        catch (e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::fileSize: exception by file: ${file}`, e);
                }
                else {
                    console.error(e);
                }
            }
            return -1;
        }
    }
    static async fileRename(filePath, targetPath) {
        try {
            await rename(filePath, targetPath);
        }
        catch (e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::fileRename: exception by file: ${filePath}`, e);
                }
                else {
                    console.error(e);
                }
            }
            return false;
        }
        return true;
    }
    static async fileDelete(file) {
        try {
            await unlink(file);
        }
        catch (e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::fileDelete: exception by file: ${file}`, e);
                }
                else {
                    console.error(e);
                }
            }
            return false;
        }
        return true;
    }
    static async chmod(apath, mode) {
        return chmod(apath, mode);
    }
    static async create(file, content) {
        return writeFile(file, content);
    }
    static async realPath(apath) {
        return realpath(apath);
    }
    static async readJsonFile(jsonFile) {
        const raw = await FileHelper.fileRead(jsonFile);
        return JSON.parse(raw);
    }
}
//# sourceMappingURL=FileHelper.js.map