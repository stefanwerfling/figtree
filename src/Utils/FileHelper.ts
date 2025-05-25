import {Ets} from 'ets';
import {mkdir, stat, rename, unlink, lstat, readFile, chmod, writeFile, realpath} from 'fs/promises';
import {Logger} from '../Logger/Logger.js';

export class FileHelper {

    public static logDebugging: boolean = false;

    /**
     * Is a file older as duration hours?
     * @param {string} filename
     * @param {number} durationHours
     * @returns {boolean}
     */
    public static async isOlderHours(
        filename: string,
        durationHours: number
    ): Promise<boolean> {
        let stats;

        try {
            stats = await stat(filename);
        } catch (e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::isOlderHours: exception by file: ${filename}`, e);
                } else {
                    console.error(e);
                }
            }

            return true;
        }

        const fileDate = new Date(stats.mtime);
        const currentDate = new Date();

        return (currentDate.getTime() - fileDate.getTime()) > (durationHours * 60 * 60 * 1000);
    }

    /**
     * Read a File content
     * @param {string} file
     * @param {BufferEncoding} encoding
     * @return {string}
     * @throws
     */
    public static async fileRead(file: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
        return readFile(file, {
            encoding: encoding
        });
    }

    /**
     * Exist a file
     * @param {string} file
     * @param {boolean} isLink
     * @param {boolean} isSocket
     * @returns {boolean}
     */
    public static async fileExist(file: string, isLink: boolean = false, isSocket: boolean = false): Promise<boolean> {
        let fileStat;

        try {
            fileStat = await stat(file);
        } catch(e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly('FileHelper::fileExist: exception stat by file: %s', file);
                    Logger.getLogger().silly('FileHelper::fileExist: Trace: %s', Ets.formate(e, true, true));
                } else {
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

    /**
     * Return the file size
     * @param {string} file
     * @returns {number}
     */
    public static async fileSize(file: string): Promise<number> {
        try {
            return (await stat(file)).size;
        } catch (e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::fileSize: exception by file: ${file}`, e);
                } else {
                    console.error(e);
                }
            }

            return -1;
        }
    }

    /**
     * File rename
     * @param {string} filePath
     * @param {string} targetPath
     * @returns {boolean}
     */
    public static async fileRename(filePath: string, targetPath: string): Promise<boolean> {
        try {
            await rename(filePath, targetPath);
        } catch (e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::fileRename: exception by file: ${filePath}`, e);
                } else {
                    console.error(e);
                }
            }

            return false;
        }

        return true;
    }

    /**
     * File delete
     * @param {string} file
     * @returns {boolean}
     */
    public static async fileDelete(file: string): Promise<boolean> {
        try {
            await unlink(file);
        } catch (e) {
            if (FileHelper.logDebugging) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::fileDelete: exception by file: ${file}`, e);
                } else {
                    console.error(e);
                }
            }

            return false;
        }

        return true;
    }

    /**
     * Chmod a path
     * @param {string} apath
     * @param {number|string} mode
     */
    public static async chmod(apath: string, mode: string|number): Promise<void> {
        return chmod(apath, mode);
    }

    /**
     * Create a file with content
     * @param {string} file
     * @param {string} content
     */
    public static async create(file: string, content: string): Promise<void> {
        return writeFile(file, content);
    }

    /**
     * Real path
     * @param {string} apath
     * @returns {string}
     */
    public static async realPath(apath: string): Promise<string> {
        return realpath(apath);
    }

    /**
     * Read a content from File and parse as a JSON object
     * @param {string} jsonFile
     */
    public static async readJsonFile(jsonFile: string): Promise<any> {
        const raw = await FileHelper.fileRead(jsonFile);

        return JSON.parse(raw);
    }

}