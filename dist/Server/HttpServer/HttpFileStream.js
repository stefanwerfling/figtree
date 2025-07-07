import { Logger } from '../../Logger/Logger.js';
import { FileHelper } from '../../Utils/FileHelper.js';
export class HttpFileStream {
    static responseStream(stream, contentType, response) {
        let success = true;
        stream.on('error', (err) => {
            Logger.getLogger().error('HttpFileStream::responseStream::stream::error: file error!');
            success = false;
        });
        response.setHeader('Content-Type', contentType);
        stream.pipe(response);
        return success;
    }
    static responseFile(filePath, contentType, response) {
        const stream = FileHelper.streamFile(filePath);
        return this.responseStream(stream, contentType, response);
    }
}
//# sourceMappingURL=HttpFileStream.js.map