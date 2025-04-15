import fs from 'fs';
import https from 'https';
import express, {Application, NextFunction, Request, Response} from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import {PemHelper} from '../../Crypto/PemHelper.js';
import {Logger} from '../../Logger/Logger.js';
import {FileHelper} from '../../Utils/FileHelper.js';
import {ITlsClientError} from './ITlsClientError.js';
import {ITlsSocket} from './ITlsSocket.js';
import {DefaultRoute} from './Routes/DefaultRoute.js';

/**
 * BaseHttpServerOptionCrypt
 */
export type BaseHttpServerOptionCrypt = {
    sslPath?: string;
    key?: string;
    crt?: string;
};

/**
 * Base http server option session
 */
export type BaseHttpServerOptionSession = {
    max_age: number;
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
     * server default port
     * @private
     */
    protected readonly _port: number = 3000;

    /**
     * server object
     * @private
     */
    protected readonly _server: Application;

    /**
     * realm
     * @private
     */
    protected readonly _realm: string;

    /**
     * session
     * @protected
     */
    protected readonly _session: BaseHttpServerOptionSession;

    /**
     * use crypt
     * @private
     */
    protected readonly _crypt: BaseHttpServerOptionCrypt = {};

    /**
     * constructor
     * @param {BaseHttpServerOptions} serverInit
     */
    public constructor(serverInit: BaseHttpServerOptions) {
        if (serverInit.port) {
            this._port = serverInit.port;
        }

        this._realm = serverInit.realm;
        this._session = serverInit.session;

        this._server = express();
        this._server.use((req, _, next) => {
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
        this._server.use((error: Error, _request: Request, response: Response, _next: NextFunction): void => {
            response.status(500);
            Logger.getLogger().error(error.stack);
        });
    }

    /**
     * _initServer
     * @protected
     */
    protected _initServer(): void {
        this._server.use(bodyParser.urlencoded({extended: true}));
        this._server.use(bodyParser.json());
        this._server.use(cookieParser());

        // -------------------------------------------------------------------------------------------------------------

        let useCookieSecure = false;

        if (this._crypt.sslPath && this._crypt.sslPath !== '') {
            useCookieSecure = true;
        }

        this._server.use(
            session({
                secret: this._session.secret,
                proxy: true,
                resave: true,
                saveUninitialized: true,
                store: new session.MemoryStore(),
                cookie: {
                    path: this._session.cookie_path,
                    secure: useCookieSecure,
                    maxAge: this._session.max_age
                }
            })
        );
    }

    /**
     * _routes
     * @param {DefaultRoute[]} routes
     * @private
     */
    private _routes(routes: DefaultRoute[]): void {
        routes.forEach((route) => {
            this._server.use(route.getExpressRouter());
        });
    }

    /**
     * _assets
     * @param {string|null} publicDir
     * @private
     */
    private _assets(publicDir: string | null): void {
        if (publicDir !== null) {
            this._server.use(express.static(publicDir));
        }
    }

    /**
     * Get Cert and key
     * @param {BaseHttpServerOptionCrypt} options
     * @return {BaseHttpCertKey|null}
     * @protected
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
        const app = this._server;

        const ck = await this._getCertAndKey(this._crypt);

        if (ck) {
            const httpsServer = https.createServer({
                key: ck.key,
                cert: ck.crt,
            }, app);

            httpsServer.on('tlsClientError', (err, tlsSocket) => {
                const tlsError = err as ITlsClientError;

                if (tlsError.reason === 'http request') {
                    const tTlsSocket = tlsSocket as ITlsSocket;

                    if (tTlsSocket._parent) {
                        tTlsSocket._parent.write('HTTP/1.1 302 Found\n' +
                            `Location: https://localhost:${this._port}`);
                    }

                    Logger.getLogger().error(
                        'BaseHttpServer::listen: The client call the Server over HTTP protocol. Please use HTTPS, example: https://localhost:%d',
                        this._port,
                    );
                }
            });

            httpsServer.listen(this._port, () => {
                Logger.getLogger().info(
                    'BaseHttpServer::listen: %s listening on the https://localhost:%d',
                    this._realm,
                    this._port
                );
            });
        } else {
            app.listen(this._port, () => {
                Logger.getLogger().info(
                    'BaseHttpServer::listen: %s listening on the http://localhost:%d',
                    this._realm,
                    this._port
                );
            });
        }
    }

}