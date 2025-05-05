export declare class FileHelper {
    static logDebugging: boolean;
    static isOlderHours(filename: string, durationHours: number): Promise<boolean>;
    static fileRead(file: string, encoding?: BufferEncoding): Promise<string>;
    static fileExist(file: string, isLink?: boolean, isSocket?: boolean): Promise<boolean>;
    static fileSize(file: string): Promise<number>;
    static fileRename(filePath: string, targetPath: string): Promise<boolean>;
    static fileDelete(file: string): Promise<boolean>;
    static chmod(apath: string, mode: string | number): Promise<void>;
    static create(file: string, content: string): Promise<void>;
    static realPath(apath: string): Promise<string>;
}
