import fs from 'fs';
import https from 'https';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { PemHelper } from '../../Crypto/PemHelper.js';
import { Logger } from '../../Logger/Logger.js';
import { FileHelper } from '../../Utils/FileHelper.js';
export class BaseHttpServer {
    static _listenHost = 'localhost';
    _port = 3000;
    _express;
    _server = null;
    _realm;
    _session;
    _crypt;
    constructor(serverInit) {
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
        if (serverInit.routes) {
            this._routes(serverInit.routes);
        }
        if (serverInit.publicDir) {
            this._assets(serverInit.publicDir);
        }
        if (serverInit.crypt) {
            this._crypt = serverInit.crypt;
        }
        this._express.use((error, _request, response, _next) => {
            response.status(500);
            Logger.getLogger().error(error.stack);
        });
    }
    _initServer() {
        this._express.use(bodyParser.urlencoded({ extended: true }));
        this._express.use(bodyParser.json());
        this._express.use(cookieParser());
        if (this._session) {
            this._express.use(session({
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
            }));
        }
    }
    _routes(routes) {
        routes.forEach((route) => {
            this._express.use(route.getExpressRouter());
        });
    }
    _assets(publicDir) {
        if (publicDir !== null) {
            this._express.use(express.static(publicDir));
        }
    }
    async _checkKeyFile(keyFile) {
        if (await FileHelper.fileExist(keyFile)) {
            Logger.getLogger().silly('BaseHttpServer::listen: express certs found in path: %s', this._crypt?.sslPath);
            return true;
        }
        return false;
    }
    async _getCertAndKey(options) {
        if (options.key && options.crt) {
            let strKey;
            let strCrt;
            if (await FileHelper.fileExist(options.key)) {
                strKey = fs.readFileSync(options.key).toString();
            }
            else if (PemHelper.isPemStr(options.key)) {
                strKey = options.key;
            }
            else {
                return null;
            }
            if (await FileHelper.fileExist(options.crt)) {
                strCrt = fs.readFileSync(options.crt).toString();
            }
            else if (PemHelper.isPemStr(options.crt)) {
                strCrt = options.crt;
            }
            else {
                return null;
            }
            return {
                key: strKey,
                crt: strCrt
            };
        }
        return null;
    }
    async listen() {
        if (this._crypt) {
            const ck = await this._getCertAndKey(this._crypt);
            if (ck) {
                this._server = https.createServer({
                    key: ck.key,
                    cert: ck.crt
                }, this._express);
                this._server.on('tlsClientError', (err, atlsSocket) => {
                    const tlsError = err;
                    if (tlsError.reason === 'http request') {
                        const tTlsSocket = atlsSocket;
                        if (tTlsSocket._parent) {
                            tTlsSocket._parent.write('HTTP/1.1 302 Found\n' +
                                `Location: https://${BaseHttpServer._listenHost}:${this._port}`);
                        }
                        Logger.getLogger().error('BaseHttpServer::listen: The client call the Server over HTTP protocol. Please use HTTPS, example: https://%s:%d', BaseHttpServer._listenHost, this._port);
                    }
                });
                this._server.listen(this._port, () => {
                    Logger.getLogger().info('BaseHttpServer::listen: %s listening on the https://%s:%d', this._realm, BaseHttpServer._listenHost, this._port);
                });
            }
            else {
                Logger.getLogger().error('BaseHttpServer::listen: Key and Certificate not found for http server!');
            }
        }
        else {
            this._server = this._express.listen(this._port, () => {
                Logger.getLogger().info('BaseHttpServer::listen: %s listening on the http://%s:%d', this._realm, BaseHttpServer._listenHost, this._port);
            });
        }
    }
    close() {
        if (this._server !== null) {
            this._server.close();
            this._server = null;
        }
    }
}
//# sourceMappingURL=BaseHttpServer.js.map