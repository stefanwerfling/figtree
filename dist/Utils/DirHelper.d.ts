export declare class DirHelper {
    static getFiles(dir: string, recursive?: boolean, base?: string): Promise<string[]>;
    static directoryExist(director: string): Promise<boolean>;
    static mkdir(director: string, recursive?: boolean): Promise<boolean>;
}
