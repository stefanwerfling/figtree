import { Buffer } from 'node:buffer';
import { Request, Response } from 'express';
export type HttpUploadChunkInfo = {
    filename: string;
    totalChunks: number;
    receivedChunks: number;
    filePath: string;
    uuid: string;
};
export type FnHttpUploadHandleSuccess = (res: Response, file: HttpUploadChunkInfo) => Promise<void>;
export declare class HttpUpload {
    static uploadProgress: {
        [key: string]: HttpUploadChunkInfo;
    };
    static getBoundary(contentType: string): string | null;
    static parsePart(part: Buffer): {
        headers: {
            [key: string]: string;
        };
        data: Buffer;
    } | null;
    static getFields(fields: string[], parts: Buffer[]): Map<string, string>;
    static handleUpload(req: Request, res: Response, uploadDir: string, onSuccess: FnHttpUploadHandleSuccess): Promise<void>;
}
