import { ReadStream } from 'fs';
import { Stream } from 'node:stream';
export declare class FileHelper {
    static logDebugging: boolean;
    static isOlderHours(filename: string, durationHours: number): Promise<boolean>;
    static fileRead(file: string, encoding?: BufferEncoding): Promise<string>;
    static fileExist(file: string, isLink?: boolean, isSocket?: boolean): Promise<boolean>;
    static fileSize(file: string): Promise<number>;
    static fileRename(filePath: string, targetPath: string): Promise<boolean>;
    static fileDelete(file: string): Promise<boolean>;
    static chmod(apath: string, mode: string | number): Promise<void>;
    static create(file: string, content: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream): Promise<void>;
    static realPath(apath: string): Promise<string>;
    static readJsonFile(jsonFile: string): Promise<any>;
    static readBufferFile(file: string, options?: {
        encoding?: null | undefined;
        flag?: string | undefined;
    } | null): Promise<NonSharedBuffer>;
    static streamFile(filePath: string): ReadStream;
}
