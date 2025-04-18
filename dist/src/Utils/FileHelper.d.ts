export declare class FileHelper {
    static isOlderHours(filename: string, durationHours: number): Promise<boolean>;
    static fileRead(file: string, encoding?: BufferEncoding): Promise<string>;
    static fileExist(file: string, allowLink?: boolean): Promise<boolean>;
    static fileSize(file: string): Promise<number>;
    static fileRename(filePath: string, targetPath: string): Promise<boolean>;
    static fileDelete(file: string): Promise<boolean>;
}
