import * as http from 'node:http';
import express, { Application } from 'express';
import { Store } from 'express-session';
import { IDefaultRoute } from './Routes/IDefaultRoute.js';
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
export type BaseHttpServerOptionProxy = {
    trust: string | boolean | string[];
};
export type BaseHttpServerOptions = {
    realm: string;
    port?: number;
    routes?: IDefaultRoute[];
    session: BaseHttpServerOptionSession;
    publicDir?: string;
    crypt?: BaseHttpServerOptionCrypt;
    proxy?: BaseHttpServerOptionProxy;
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
    protected _sessionParser: express.RequestHandler | null;
    protected readonly _realm: string;
    protected readonly _session?: BaseHttpServerOptionSession;
    protected readonly _crypt?: BaseHttpServerOptionCrypt;
    protected readonly _proxy?: BaseHttpServerOptionProxy;
    constructor(serverInit: BaseHttpServerOptions);
    protected _getSessionStore(): Store;
    protected _initServer(): void;
    private _routes;
    private _assets;
    protected _checkKeyFile(keyFile: string): Promise<boolean>;
    protected _getCertAndKey(options: BaseHttpServerOptionCrypt): Promise<BaseHttpCertKey | null>;
    listen(): Promise<void>;
    close(): void;
}
