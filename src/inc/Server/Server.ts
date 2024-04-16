import * as net from 'net';
import {Message} from './Base/Message.js';
import {Client} from './Client/Client.js';

/**
 * Server
 */
export class Server {

    protected _port: number;

    protected _host: string;

    protected _server: net.Server;

    protected _isListen: boolean = false;

    protected _clients: Client[] = [];

    /**
     * Create a server instance
     * @param {number} port
     * @param {host} host
     */
    public constructor(port: number, host: string) {
        this._port = port;
        this._host = host;

        this._server = net.createServer();
        this._server.on('connection', (socket) => {
            this._clients.push(this._createNewClient(socket));
        });
    }

    /**
     * override this function with your own client
     * @param {net.Socket} socket
     * @protected
     */
    protected _createNewClient(socket: net.Socket): Client {
        return new Client(this, socket);
    }

    /**
     * listen
     */
    public listen(): void {
        this._server.listen(this._port, this._host, () => {
            this._isListen = true;
        });
    }

    /**
     * broadcast: send a message to all clients
     * @param {Message} msg
     * @param {Client} sender
     */
    public broadcast(msg: Message, sender: Client): void {
        for (const client of this._clients) {
            if (client === sender) {
                return;
            }

            client.sendMessage(msg);
        }
    }

    public removeClient(client: Client): boolean {
        this._clients.splice(this._clients.indexOf(client), 1);
        return true;
    }

}