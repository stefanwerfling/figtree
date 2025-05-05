import * as net from 'net';
import { Message } from './Base/Message.js';
import { Client } from './Client/Client.js';
export declare class Server {
    protected _port: number;
    protected _host: string;
    protected _server: net.Server;
    protected _isListen: boolean;
    protected _clients: Client[];
    constructor(port: number, host: string);
    protected _createNewClient(socket: net.Socket): Client;
    listen(): void;
    broadcast(msg: Message, sender: Client): void;
    removeClient(client: Client): boolean;
}
