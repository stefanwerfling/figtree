import * as net from 'net';
import {Message} from '../Base/Message.js';
import {Server} from '../Server.js';

export class Client {

    protected _server: Server;
    protected _socket: net.Socket;

    public constructor(server: Server, socket: net.Socket) {
        this._server = server;
        this._socket = socket;

        socket.on('end', () => {
            this._server.removeClient(this);
        });

        socket.on('data', (data: Buffer) => {
            this.receiveMessage(new Message(data));
        });
    }

    public sendMessage(msg: Message): boolean {
        return this._socket.write(msg.getData());
    }

    public receiveMessage(msg: Message): void {
        throw new Error(`Overwrite this methode! Message: ${msg.getData()}`);
    }

}