import {Response} from 'express';
import {ReadStream} from 'fs';
import {Logger} from '../../Logger/Logger.js';
import {FileHelper} from '../../Utils/FileHelper.js';

export class HttpFileStream {

    /**
     * Response a stream to the http client
     * @param {ReadStream} stream
     * @param {string} contentType
     * @param {Response} response
     * @return boolean;
     */
    public static responseStream(stream: ReadStream, contentType: string, response: Response): boolean {
        let success = true;

        stream.on('error', (err) => {
            Logger.getLogger().error('HttpFileStream::responseStream::stream::error: file error!');
            success = false;
        });

        response.setHeader('Content-Type', contentType);
        stream.pipe(response);

        return success;
    }

    /**
     * Response a file as stream to the http client
     * @param {string} filePath
     * @param {string} contentType
     * @param {Response} response
     */
    public static responseFile(filePath: string, contentType: string, response: Response): boolean {
        const stream = FileHelper.streamFile(filePath);
        return this.responseStream(stream, contentType, response);
    }

}