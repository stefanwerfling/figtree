import { Logger } from '../../Logger/Logger.js';
import { DirHelper } from '../../Utils/DirHelper.js';
import { FileHelper } from '../../Utils/FileHelper.js';
import { BaseHttpServer } from './BaseHttpServer.js';
import path from 'path';
export class USHttpServer extends BaseHttpServer {
    _unixPath = '';
    _socketMainPath;
    _socketName;
    constructor(serverInit) {
        super(serverInit);
        this._socketMainPath = serverInit.socket.mainPath;
        this._socketName = serverInit.socket.socketName;
    }
    async _getUnixSocket() {
        const sockDirectory = path.join(this._socketMainPath, 'socks');
        if (!await DirHelper.directoryExist(sockDirectory)) {
            await DirHelper.mkdir(sockDirectory, true);
        }
        const sockUnix = path.join(sockDirectory, `${this._socketName}.sock`);
        if (await FileHelper.fileExist(sockUnix, true, true)) {
            await FileHelper.fileDelete(sockUnix);
        }
        return sockUnix;
    }
    getUnixSocket() {
        return this._unixPath;
    }
    async listen() {
        const app = this._express;
        this._unixPath = await this._getUnixSocket();
        this._server = app.listen(this._unixPath, () => {
            Logger.getLogger().info('USHttpServer::listen: %s listening on the socket %s', this._realm, this._unixPath);
            FileHelper.chmod(this._unixPath, 0o777);
            Logger.getLogger().info('USHttpServer::listen: set chmod 777 to socket %s', this._unixPath);
        });
        this._server.on('error', (err) => {
            Logger.getLogger().error('USHttpServer::error', err);
        });
    }
}
//# sourceMappingURL=USHttpServer.js.map