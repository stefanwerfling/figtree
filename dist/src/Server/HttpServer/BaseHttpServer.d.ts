import * as http from 'node:http';
import { Application } from 'express';
import { DefaultRoute } from './Routes/DefaultRoute.js';
export type BaseHttpServerOptionCrypt = {
    sslPath: string;
    key: string;
    crt: string;
};
export type BaseHttpServerOptionSession = {
    max_age: number;
    ssl_path: string;
    cookie_path: string;
    secret: string;
};
export type BaseHttpServerOptions = {
    realm: string;
    port?: number;
    routes?: DefaultRoute[];
    session: BaseHttpServerOptionSession;
    publicDir?: string;
    crypt?: BaseHttpServerOptionCrypt;
};
export type BaseHttpCertKey = {
    key: string;
    crt: string;
};
export declare class BaseHttpServer {
    protected static _listenHost: string;
    protected readonly _port: number;
    protected readonly _express: Application;
    protected _server: http.Server | null;
    protected readonly _realm: string;
    protected readonly _session?: BaseHttpServerOptionSession;
    protected readonly _crypt?: BaseHttpServerOptionCrypt;
    constructor(serverInit: BaseHttpServerOptions);
    protected _initServer(): void;
    private _routes;
    private _assets;
    protected _checkKeyFile(keyFile: string): Promise<boolean>;
    listen(): Promise<void>;
    close(): void;
}
