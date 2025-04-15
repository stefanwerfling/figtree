import {mkdir, stat, rename, unlink, lstat, readFile} from 'fs/promises';
import {Logger} from '../Logger/Logger.js';

export class FileHelper {

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
     * @param {boolean} allowLink
     * @returns {boolean}
     */
    public static async fileExist(file: string, allowLink: boolean = false): Promise<boolean> {
        try {
            if( (await stat(file)).isFile()) {
                return true;
            }
        } catch (e) {
            if (Logger.hasLogger()) {
                Logger.getLogger().silly(`FileHelper::fileExist: exception by file: ${file}`, e);
            } else {
                console.error(e);
            }
        }

        if (allowLink) {
            try {
                if ((await lstat(file)).isSymbolicLink()) {
                    return true;
                }
            } catch (e) {
                if (Logger.hasLogger()) {
                    Logger.getLogger().silly(`FileHelper::fileExist: exception by file link: ${file}`, e);
                } else {
                    console.error(e);
                }
            }
        }

        return false;
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
            return false;
        }

        return true;
    }
}