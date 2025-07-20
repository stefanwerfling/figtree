import {readdir, stat, mkdir} from 'fs/promises';
import * as path from 'path';

/**
 * Dire helper class
 */
export class DirHelper {

    /**
     * Read files by path
     * @param {string} dir
     * @param {boolean} recursive
     * @param {string} base
     * @returns {string[]}
     */
    public static async getFiles(dir: string, recursive: boolean = false, base = dir): Promise<string[]> {
        const entries = await readdir(dir, { withFileTypes: true });

        const files = await Promise.all(entries.map(async(entry) => {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && recursive) {
                return this.getFiles(fullPath, recursive, base);
            } else {
                return [path.relative(base, fullPath)];
            }
        }));

        return files.flat();
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