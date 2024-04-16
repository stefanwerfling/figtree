import * as net from 'net';
import { Client } from './Client/Client.js';
export class Server {
    _port;
    _host;
    _server;
    _isListen = false;
    _clients = [];
    constructor(port, host) {
        this._port = port;
        this._host = host;
        this._server = net.createServer();
        this._server.on('connection', (socket) => {
            this._clients.push(this._createNewClient(socket));
        });
    }
    _createNewClient(socket) {
        return new Client(this, socket);
    }
    listen() {
        this._server.listen(this._port, this._host, () => {
            this._isListen = true;
        });
    }
    broadcast(msg, sender) {
        for (const client of this._clients) {
            if (client === sender) {
                return;
            }
            client.sendMessage(msg);
        }
    }
    removeClient(client) {
        this._clients.splice(this._clients.indexOf(client), 1);
        return true;
    }
}
//# sourceMappingURL=Server.js.map