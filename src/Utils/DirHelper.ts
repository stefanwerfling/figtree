import {readdir, stat, mkdir} from 'fs/promises';

/**
 * Dire helper class
 */
export class DirHelper {

    /**
     * Read files by path
     * @param {string} path
     * @returns {string[]}
     */
    public static async getFiles(path: string): Promise<string[]> {
        return readdir(path);
    }

    /**
     * Exist a directory
     * @param {string} director
     * @returns {boolean}
     */
    public static async directoryExist(director: string): Promise<boolean> {
        try {
            return (await stat(director)).isDirectory();
        } catch (e) {
            return false;
        }
    }

    /**
     * Create a directory
     * @param {string} director
     * @param {boolean} recursive
     * @returns {boolean}
     */
    public static async mkdir(director: string, recursive: boolean = false): Promise<boolean> {
        try {
            await mkdir(director, {
                recursive: recursive
            });
        } catch (e) {
            return false;
        }

        return true;
    }

}