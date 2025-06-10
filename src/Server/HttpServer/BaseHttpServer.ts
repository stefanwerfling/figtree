import csurf from 'csurf';
import fs from 'fs';
import https from 'https';
import * as http from 'node:http';
import express, {Application, NextFunction, Request, Response} from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session, {Store} from 'express-session';
import {PemHelper} from '../../Crypto/PemHelper.js';
import {Logger} from '../../Logger/Logger.js';
import {DefaultReturn} from '../../Schemas/Server/Routes/DefaultReturn.js';
import {StatusCodes} from '../../Schemas/Server/Routes/StatusCodes.js';
import {FileHelper} from '../../Utils/FileHelper.js';
import {IDefaultRoute} from './Routes/IDefaultRoute.js';
import {ITlsClientError} from './Tls/ITlsClientError.js';
import {ITlsSocket} from './Tls/ITlsSocket.js';

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
 * Base http server option proxy
 */
export type BaseHttpServerOptionProxy = {
    trust: string|boolean|string[]
};

/**
 * Base http server option csrf
 */
export type BaseHttpServerOptionCsrf = {
    cookie: boolean;
};

/**
 * Base http server options
 */
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
     * Server session express parser
     * @protected
     */
    protected _sessionParser: express.RequestHandler|null = null;

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
     * use proxy
     * @protected
     */
    protected readonly _proxy?: BaseHttpServerOptionProxy;

    /**
     * use csrf
     * @protected
     */
    protected readonly _csrf?: BaseHttpServerOptionCsrf;

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

        if (serverInit.proxy) {
            this._proxy = serverInit.proxy;
        }

        if (serverInit.csrf) {
            this._csrf = serverInit.csrf;
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
        this._express.use((error: any, _request: Request, response: Response, _next: NextFunction): void => {
            if (error instanceof SyntaxError && 'body' in error) {
                Logger.getLogger().warn('Invalid JSON received:', error.message);

                const resulte: DefaultReturn = {
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'Invalid JSON payload'
                };

                response.status(400).json(resulte);
                return;
            }

            Logger.getLogger().error(error.stack || error.message);
            response.status(500).send('Internal Server Error');
        });
    }

    /**
     * Return the session store, default is Memory Store
     * @protected
     * @return {Store}
     */
    protected _getSessionStore(): Store {
        return new session.MemoryStore();
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

        if (this._csrf) {
            this._express.use(csurf({ cookie: this._csrf.cookie }));
        }

        // -------------------------------------------------------------------------------------------------------------

        if (this._session) {
            this._sessionParser = session({
                secret: this._session.secret,
                proxy: true,
                resave: true,
                saveUninitialized: true,
                store: this._getSessionStore(),
                cookie: {
                    path: this._session.cookie_path,
                    secure: this._session.ssl_path !== '',
                    maxAge: this._session.max_age
                }
            });

            this._express.use(this._sessionParser);
        }

        // -------------------------------------------------------------------------------------------------------------

        if (this._proxy) {
            this._express.set('trust proxy', this._proxy.trust);
        }
    }

    /**
     * _routes
     * @param {IDefaultRoute[]} routes
     * @private
     */
    private _routes(routes: IDefaultRoute[]): void {
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
     * Get Cert and Key
     * @param {BaseHttpServerOptionCrypt} options
     * @protected {BaseHttpCertKey|null}
     */
    protected async _getCertAndKey(options: BaseHttpServerOptionCrypt): Promise<BaseHttpCertKey|null> {
        if (options.key && options.crt) {
            let strKey: string;
            let strCrt: string;

            if (await FileHelper.fileExist(options.key)) {
                strKey = fs.readFileSync(options.key).toString();
            } else if (PemHelper.isPemStr(options.key)) {
                strKey = options.key;
            } else {
                return null;
            }

            if (await FileHelper.fileExist(options.crt)) {
                strCrt = fs.readFileSync(options.crt).toString();
            } else if (PemHelper.isPemStr(options.crt)) {
                strCrt = options.crt;
            } else {
                return null;
            }

            return {
                key: strKey,
                crt: strCrt
            };
        }

        return null;
    }

    /**
     * listen
     */
    public async listen(): Promise<void> {
        if (this._crypt) {
            const ck = await this._getCertAndKey(this._crypt);

            if (ck) {
                this._server = https.createServer({
                    key: ck.key,
                    cert: ck.crt
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
                            'BaseHttpServer::listen: The client call the Server over HTTP protocol. Please use HTTPS, example: https://%s:%d',
                            BaseHttpServer._listenHost,
                            this._port
                        );
                    }
                });

                this._server.listen(this._port, () => {
                    Logger.getLogger().info(
                        'BaseHttpServer::listen: %s listening on the https://%s:%d',
                        this._realm,
                        BaseHttpServer._listenHost,
                        this._port
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

    /**
     * Return the http server
     * @return {http.Server|null}
     */
    public getServer(): http.Server|null {
        return this._server;
    }

}