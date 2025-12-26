import * as http from 'node:http';
import express, { Application } from 'express';
import { Store } from 'express-session';
import { IDefaultRoute } from './Routes/IDefaultRoute.js';
declare module 'express-session' {
    interface SessionData {
        user?: unknown;
    }
}
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
export type BaseHttpServerOptionCsrf = {
    cookie: boolean;
};
export type BaseHttpServerOptions = {
    realm: string;
    port?: number;
    routes?: IDefaultRoute[];
    session: BaseHttpServerOptionSession;
    publicDir?: string;
    crypt?: BaseHttpServerOptionCrypt;
    proxy?: BaseHttpServerOptionProxy;
    csrf?: BaseHttpServerOptionCsrf;
};
export type BaseHttpCertKey = {
    key: string;
    crt: string;
};
export declare class BaseHttpServer {
    protected static _listenHost: string;
    protected readonly _port: number;
    protected _express?: Application;
    protected _server: http.Server | null;
    protected _sessionParser: express.RequestHandler | null;
    protected _realm: string;
    protected _publicDir?: string;
    protected _routes: IDefaultRoute[];
    protected readonly _session?: BaseHttpServerOptionSession;
    protected readonly _crypt?: BaseHttpServerOptionCrypt;
    protected readonly _proxy?: BaseHttpServerOptionProxy;
    protected readonly _csrf?: BaseHttpServerOptionCsrf;
    constructor(serverInit: BaseHttpServerOptions);
    protected _initSession(): void;
    protected _initExpress(): void;
    protected _initExpressUsePre(): void;
    protected _initExpressUseAfter(): void;
    protected _initExpressUseMain(): void;
    protected _getSessionStore(): Store;
    setup(): Promise<void>;
    protected _initServer(): Promise<void>;
    private _routesUse;
    private _assets;
    protected _checkKeyFile(keyFile: string): Promise<boolean>;
    protected _getCertAndKey(options: BaseHttpServerOptionCrypt): Promise<BaseHttpCertKey | null>;
    listen(): Promise<void>;
    setupAndListen(): Promise<void>;
    close(): void;
    getServer(): http.Server | null;
    getSessionParser(): express.RequestHandler | null;
}
