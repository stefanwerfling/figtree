import { Response } from 'express';
import { ReadStream } from 'fs';
export declare class HttpFileStream {
    static responseStream(stream: ReadStream, contentType: string, response: Response): boolean;
    static responseFile(filePath: string, contentType: string, response: Response): boolean;
}
