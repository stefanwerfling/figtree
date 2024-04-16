/// <reference types="node" resolution-mode="require"/>
import * as net from 'net';
import { Message } from '../Base/Message.js';
import { Server } from '../Server.js';
export declare class Client {
    protected _server: Server;
    protected _socket: net.Socket;
    constructor(server: Server, socket: net.Socket);
    sendMessage(msg: Message): boolean;
    receiveMessage(msg: Message): void;
}
