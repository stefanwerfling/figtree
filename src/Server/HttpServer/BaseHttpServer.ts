import https from 'https';
import * as http from 'node:http';
import express, {Application, NextFunction, Request, Response} from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import Path from 'path';
import {Logger} from '../../Logger/Logger.js';
import {DirHelper} from '../../Utils/DirHelper.js';
import {FileHelper} from '../../Utils/FileHelper.js';
import {ITlsClientError} from './Tls/ITlsClientError.js';
import {ITlsSocket} from './Tls/ITlsSocket.js';
import {DefaultRoute} from './Routes/DefaultRoute.js';

/**
 * BaseHttpServerOptionCrypt
 */
export type BaseHttpServerOptionCrypt = {
    sslPath: string;
    key: string;
    crt: string;
};

/**
 * Base http server option session
 */
export type BaseHttpServerOptionSession = {
    max_age: number;
    ssl_path: string;
    cookie_path: string;
    secret: string;
};

/**
 * Base http server options
 */
export type BaseHttpServerOptions = {
    realm: string;
    port?: number;
    routes?: DefaultRoute[];
    session: BaseHttpServerOptionSession;
    publicDir?: string;
    crypt?: BaseHttpServerOptionCrypt;
};

/**
 * BaseHttpCertKey
 */
export type BaseHttpCertKey = {
    key: string;
    crt: string;
};

/**
 * Base http server
 */
export class BaseHttpServer {

    /**
     * List host address
     * @protected
     */
    protected static _listenHost: string = 'localhost';

    /**
     * server default port
     * @private
     */
    protected readonly _port: number = 3000;

    /**
     * express object
     * @private
     */
    protected readonly _express: Application;

    /**
     * Server object
     * @protected
     */
    protected _server: http.Server|null = null;


    /**
     * realm
     * @private
     */
    protected readonly _realm: string;

    /**
     * session
     * @protected
     */
    protected readonly _session?: BaseHttpServerOptionSession;

    /**
     * use crypt
     * @private
     */
    protected readonly _crypt?: BaseHttpServerOptionCrypt;

    /**
     * constructor
     * @param {BaseHttpServerOptions} serverInit
     */
    public constructor(serverInit: BaseHttpServerOptions) {
        if (serverInit.port) {
            this._port = serverInit.port;
        }

        this._realm = serverInit.realm;

        if (serverInit.session) {
            this._session = serverInit.session;
        }

        this._express = express();
        this._express.use((req, _, next) => {
            Logger.getLogger().silly('BaseHttpServer::request: Url: %s Protocol: %s Method: %s', req.url, req.protocol, req.method);
            next();
        });

        this._initServer();

        // -------------------------------------------------------------------------------------------------------------

        if (serverInit.routes) {
            this._routes(serverInit.routes);
        }

        if (serverInit.publicDir) {
            this._assets(serverInit.publicDir);
        }

        if (serverInit.crypt) {
            this._crypt = serverInit.crypt;
        }

        // add error handling
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this._express.use((error: Error, _request: Request, response: Response, _next: NextFunction): void => {
            response.status(500);
            Logger.getLogger().error(error.stack);
        });
    }

    /**
     * _initServer
     * @protected
     */
    protected _initServer(): void {
        this._express.use(bodyParser.urlencoded({extended: true}));
        this._express.use(bodyParser.json());
        this._express.use(cookieParser());

        // -------------------------------------------------------------------------------------------------------------

        if (this._session) {
            this._express.use(
                session({
                    secret: this._session.secret,
                    proxy: true,
                    resave: true,
                    saveUninitialized: true,
                    store: new session.MemoryStore(),
                    cookie: {
                        path: this._session.cookie_path,
                        secure: this._session.ssl_path !== '',
                        maxAge: this._session.max_age
                    }
                })
            );
        }
    }

    /**
     * _routes
     * @param {DefaultRoute[]} routes
     * @private
     */
    private _routes(routes: DefaultRoute[]): void {
        routes.forEach((route) => {
            this._express.use(route.getExpressRouter());
        });
    }

    /**
     * _assets
     * @param {string|null} publicDir
     * @private
     */
    private _assets(publicDir: string | null): void {
        if (publicDir !== null) {
            this._express.use(express.static(publicDir));
        }
    }

    /**
     * _checkKeyFile
     * @param {string} keyFile
     * @protected
     * @return {boolean}
     */
    protected async _checkKeyFile(keyFile: string): Promise<boolean> {
        if (await FileHelper.fileExist(keyFile)) {
            Logger.getLogger().silly('BaseHttpServer::listen: express certs found in path: %s', this._crypt?.sslPath);

            return true;
        }

        return false;
    }

    /**
     * listen
     */
    public async listen(): Promise<void> {
        if (this._crypt) {
            await DirHelper.mkdir(this._crypt.sslPath, true);

            const keyFile = Path.join(this._crypt.sslPath, this._crypt.key);
            const crtFile = Path.join(this._crypt.sslPath, this._crypt.crt);

            if (await this._checkKeyFile(keyFile)) {
                const privateKey = await FileHelper.fileRead(keyFile);
                const crt = await FileHelper.fileRead(crtFile);

                this._server = https.createServer({
                    key: privateKey,
                    cert: crt
                }, this._express);

                this._server.on('tlsClientError', (err, atlsSocket) => {
                    const tlsError = err as ITlsClientError;

                    if (tlsError.reason === 'http request') {
                        const tTlsSocket = atlsSocket as ITlsSocket;

                        if (tTlsSocket._parent) {
                            tTlsSocket._parent.write('HTTP/1.1 302 Found\n' +
                                `Location: https://${BaseHttpServer._listenHost}:${this._port}`);
                        }

                        Logger.getLogger().error(
                            'The client call the Server over HTTP protocol. Please use HTTPS, example: https://%s:%d',
                            BaseHttpServer._listenHost,
                            this._port,
                            {
                                class: 'BaseHttpServer::listen'
                            }
                        );
                    }
                });

                this._server.listen(this._port, () => {
                    Logger.getLogger().info(
                        '%s listening on the https://%s:%d',
                        this._realm,
                        BaseHttpServer._listenHost,
                        this._port,
                        {
                            class: 'BaseHttpServer::listen'
                        }
                    );
                });
            } else {
                Logger.getLogger().error('BaseHttpServer::listen: Key and Certificate not found for http server!');
            }
        } else {
            this._server = this._express.listen(this._port, () => {
                Logger.getLogger().info(
                    'BaseHttpServer::listen: %s listening on the http://%s:%d',
                    this._realm,
                    BaseHttpServer._listenHost,
                    this._port
                );
            });
        }
    }

    /**
     * Close the server listen
     */
    public close(): void {
        if (this._server !== null) {
            this._server.close();
            this._server = null;
        }
    }

}