import { Message } from '../Base/Message.js';
export class Client {
    _server;
    _socket;
    constructor(server, socket) {
        this._server = server;
        this._socket = socket;
        socket.on('end', () => {
            this._server.removeClient(this);
        });
        socket.on('data', (data) => {
            this.receiveMessage(new Message(data));
        });
    }
    sendMessage(msg) {
        return this._socket.write(msg.getData());
    }
    receiveMessage(msg) {
        throw new Error(`Overwrite this methode! Message: ${msg.getData()}`);
    }
    close() {
        if (!this._socket.closed) {
            this._socket.destroy();
        }
        this._server.removeClient(this);
    }
}
//# sourceMappingURL=Client.js.map