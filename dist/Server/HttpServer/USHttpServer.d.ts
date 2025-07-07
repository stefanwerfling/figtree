import { BaseHttpServer, BaseHttpServerOptions } from './BaseHttpServer.js';
export type USHttpServerOptions = BaseHttpServerOptions & {
    socket: {
        mainPath: string;
        socketName: string;
    };
};
export declare class USHttpServer extends BaseHttpServer {
    protected _unixPath: string;
    protected _socketMainPath: string;
    protected _socketName: string;
    constructor(serverInit: USHttpServerOptions);
    protected _getUnixSocket(): Promise<string>;
    getUnixSocket(): string;
    listen(): Promise<void>;
}
