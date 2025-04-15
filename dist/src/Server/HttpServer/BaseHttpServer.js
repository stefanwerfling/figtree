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
    _port = 3000;
    _server;
    _realm;
    _session;
    _crypt = {};
    constructor(serverInit) {
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
        if (serverInit.routes) {
            this._routes(serverInit.routes);
        }
        if (serverInit.publicDir) {
            this._assets(serverInit.publicDir);
        }
        if (serverInit.crypt) {
            this._crypt = serverInit.crypt;
        }
        this._server.use((error, _request, response, _next) => {
            response.status(500);
            Logger.getLogger().error(error.stack);
        });
    }
    _initServer() {
        this._server.use(bodyParser.urlencoded({ extended: true }));
        this._server.use(bodyParser.json());
        this._server.use(cookieParser());
        let useCookieSecure = false;
        if (this._crypt.sslPath && this._crypt.sslPath !== '') {
            useCookieSecure = true;
        }
        this._server.use(session({
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
        }));
    }
    _routes(routes) {
        routes.forEach((route) => {
            this._server.use(route.getExpressRouter());
        });
    }
    _assets(publicDir) {
        if (publicDir !== null) {
            this._server.use(express.static(publicDir));
        }
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
        const app = this._server;
        const ck = await this._getCertAndKey(this._crypt);
        if (ck) {
            const httpsServer = https.createServer({
                key: ck.key,
                cert: ck.crt,
            }, app);
            httpsServer.on('tlsClientError', (err, tlsSocket) => {
                const tlsError = err;
                if (tlsError.reason === 'http request') {
                    const tTlsSocket = tlsSocket;
                    if (tTlsSocket._parent) {
                        tTlsSocket._parent.write('HTTP/1.1 302 Found\n' +
                            `Location: https://localhost:${this._port}`);
                    }
                    Logger.getLogger().error('BaseHttpServer::listen: The client call the Server over HTTP protocol. Please use HTTPS, example: https://localhost:%d', this._port);
                }
            });
            httpsServer.listen(this._port, () => {
                Logger.getLogger().info('BaseHttpServer::listen: %s listening on the https://localhost:%d', this._realm, this._port);
            });
        }
        else {
            app.listen(this._port, () => {
                Logger.getLogger().info('BaseHttpServer::listen: %s listening on the http://localhost:%d', this._realm, this._port);
            });
        }
    }
}
//# sourceMappingURL=BaseHttpServer.js.map