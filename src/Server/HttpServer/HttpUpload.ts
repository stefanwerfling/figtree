import {Buffer} from 'node:buffer';
import {Request, Response} from 'express';
import fs from 'fs';
import path from 'path';
import {Logger} from '../../Logger/Logger.js';
import {BufferHelper} from '../../Utils/BufferHelper.js';

/**
 * Upload chunk infos
 */
export type HttpUploadChunkInfo = {
    filename: string;
    totalChunks: number;
    receivedChunks: number;
    filePath: string;
    uuid: string;
};

/**
 * Function for upload handle success
 */
export type FnHttpUploadHandleSuccess = (res: Response, file: HttpUploadChunkInfo) => Promise<void>;

/**
 * Http Upload
 */
export class HttpUpload {

    /**
     * global progress uploads
     */
    public static uploadProgress: {
        [key: string]: HttpUploadChunkInfo;
    } = {};

    /**
     * Return the boundary string
     * @param {string} contentType
     * @returns {string|null}
     */
    public static getBoundary(contentType: string): string | null {
        const items = contentType.split(';');

        for (let item of items) {
            item = item.trim();

            if (item.startsWith('boundary=')) {
                return item.slice(9);
            }
        }

        return null;
    }

    /**
     * parse the parts by string
     * @param {Buffer} part
     * @returns {object|null}
     */
    public static parsePart(part: Buffer): { headers: { [key: string]: string; }; data: Buffer; } | null {
        const separator = Buffer.from('\r\n\r\n');
        const separatorIndex = part.indexOf(separator);

        if (separatorIndex === -1) {
            return null;
        }

        const headerPart = part.subarray(0, separatorIndex).toString();
        const dataPart = part.subarray(separatorIndex + separator.length, part.length - 2);

        const headers: {
            [key: string]: string;
        } = {};

        headerPart.split('\r\n').forEach(line => {
            const [key, value] = line.split(': ');

            if (key && value) {
                headers[key.toLowerCase()] = value;
            }
        });

        return {
            headers: headers,
            data: dataPart
        };
    }

    public static getFields(fields: string[], parts: Buffer[]): Map<string, string> {
        const listMap: Map<string, string> = new Map<string, string>();

        parts.forEach(part => {
            const parsed = HttpUpload.parsePart(part);

            if (parsed) {
                const {
                    headers,
                    data
                } = parsed;

                if (headers['content-disposition']) {
                    const dispositionMatch = headers['content-disposition'].match(/name="([^"]+)"/u);

                    if (dispositionMatch) {
                        if (fields.indexOf(dispositionMatch[1]) > -1) {
                            listMap.set(dispositionMatch[1], data.toString());
                        }
                    }
                }
            }
        });

        return listMap;
    }

    /**
     * handle upload basic
     * @param {Request} req
     * @param {Response} res
     * @param {string} uploadDir
     * @param {FnHttpUploadHandleSuccess} onSuccess
     */
    public static async handleUpload(req: Request, res: Response, uploadDir: string, onSuccess: FnHttpUploadHandleSuccess): Promise<void> {
        const contentType: string = req.headers['content-type'] || '';

        const boundary = HttpUpload.getBoundary(contentType);

        if (!boundary) {
            res.status(400).send('Invalid Content-Type header');
            return;
        }

        let buffer = Buffer.alloc(0);

        req.on('data', (chunk: Buffer) => {
            buffer = Buffer.concat([buffer, chunk]);
        });

        req.on('end', () => {
            let statusIsSend = false;

            const boundaryBuffer = Buffer.from(`--${boundary}`);
            const parts = BufferHelper.splitBuffer(buffer, boundaryBuffer);
            const fields = HttpUpload.getFields([
                'dzuuid',
                'dzchunkindex',
                'dztotalfilesize',
                'dzchunksize',
                'dztotalchunkcount',
                'dzchunkbyteoffset'
            ], parts);

            parts.forEach(part => {
                const parsed = HttpUpload.parsePart(part);

                if (parsed) {
                    const {headers, data} = parsed;

                    if (headers['content-disposition']) {
                        const dispositionMatch = headers['content-disposition'].match(/name="([^"]+)"/u);
                        const filenameMatch = headers['content-disposition'].match(/filename="([^"]+)"/u);

                        if (dispositionMatch) {
                            if (filenameMatch) {
                                const filename = filenameMatch[1];
                                const fileUUIDHeader = fields.get('dzuuid') || '';
                                const fileUUID = Array.isArray(fileUUIDHeader) ? fileUUIDHeader[0] : fileUUIDHeader || '';

                                const chuckIndexHeader =  fields.get('dzchunkindex') || '0';
                                const chuckIndexStr = Array.isArray(chuckIndexHeader) ? chuckIndexHeader[0] : chuckIndexHeader || '0';
                                const chunkIndex = parseInt(chuckIndexStr, 10);

                                const totalChunksHeader = fields.get('dztotalchunkcount') || '1';
                                const totalChunksStr = Array.isArray(totalChunksHeader) ? totalChunksHeader[0] : totalChunksHeader || '1';
                                const totalChunks = parseInt(totalChunksStr, 10);

                                if (!fileUUID) {
                                    Logger.getLogger().error('Missing fileUUID');
                                    return;
                                }

                                if (!HttpUpload.uploadProgress[fileUUID]) {
                                    HttpUpload.uploadProgress[fileUUID] = {
                                        filename: filename,
                                        totalChunks: totalChunks,
                                        receivedChunks: 0,
                                        filePath: path.join(uploadDir),
                                        uuid: fileUUID
                                    };
                                }

                                const chunkPath = path.join(uploadDir, `${fileUUID}.part${chunkIndex}`);

                                fs.writeFileSync(chunkPath, data);

                                HttpUpload.uploadProgress[fileUUID].receivedChunks += 1;

                                Logger.getLogger().info(`Received chunk ${chunkIndex + 1}/${totalChunks} for file ${filename} (UUID: ${fileUUID})`);

                                if (HttpUpload.uploadProgress[fileUUID].receivedChunks === HttpUpload.uploadProgress[fileUUID].totalChunks) {
                                    const finalPath = path.join(uploadDir, HttpUpload.uploadProgress[fileUUID].filename);
                                    const writeStream = fs.createWriteStream(finalPath);

                                    for (let i = 0; i < HttpUpload.uploadProgress[fileUUID].totalChunks; i++) {
                                        const chunk = fs.readFileSync(path.join(uploadDir, `${fileUUID}.part${i}`));

                                        writeStream.write(chunk);

                                        fs.unlinkSync(path.join(uploadDir, `${fileUUID}.part${i}`));
                                    }

                                    writeStream.end();

                                    statusIsSend = true;

                                    writeStream.on('finish', async() => {
                                        Logger.getLogger().info(`File ${HttpUpload.uploadProgress[fileUUID].filename} assembled successfully.`);

                                        await onSuccess(res, HttpUpload.uploadProgress[fileUUID]);
                                        delete HttpUpload.uploadProgress[fileUUID];
                                    });
                                } else {
                                    res.status(200).json({ message: 'Chunks received' });
                                    statusIsSend = true;
                                }
                            }
                        }
                    }
                }
            });

            if (!statusIsSend) {
                res.status(400).send('Invalid upload!');
            }
        });
    }

}