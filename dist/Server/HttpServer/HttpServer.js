import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Config } from '../../Config/Config.js';
import { CertificateHelper } from '../../Crypto/CertificateHelper.js';
import { Logger } from '../../Logger/Logger.js';
import { DirHelper } from '../../Utils/DirHelper.js';
import { BaseHttpServer } from './BaseHttpServer.js';
import { Session } from './Session.js';
export class HttpServer extends BaseHttpServer {
    _limiter = null;
    _initExpressUsePre() {
        if (this._express === undefined) {
            throw new Error('Express isnt init!');
        }
        super._initExpressUsePre();
        this._express.use(helmet());
        this._express.use(helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ['\'self\''],
                connectSrc: ['\'self\''],
                frameSrc: ['\'self\''],
                childSrc: ['\'self\''],
                scriptSrc: [
                    '\'self\'',
                    '*',
                    '\'unsafe-inline\''
                ],
                styleSrc: [
                    '\'self\'',
                    '*',
                    '\'unsafe-inline\''
                ],
                fontSrc: [
                    '\'self\'',
                    '*',
                    '\'unsafe-inline\''
                ],
                imgSrc: [
                    '\'self\'',
                    'https: data:'
                ],
                baseUri: ['\'self\'']
            }
        }));
        this._limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            legacyHeaders: false,
            standardHeaders: 'draft-8',
            skip: async (request) => {
                return this._limiterSkip(request);
            },
            limit: async (request) => {
                return this._limiterLimit(request);
            },
            handler: async (req, res) => {
                return this._limiterHandler(req, res);
            }
        });
        this._express.use(this._limiter);
    }
    async _limiterSkip(request) {
        if (!request.url.startsWith('/json/')) {
            return true;
        }
        if (Session.isUserLogin(request.session)) {
            return true;
        }
        else {
            Logger.getLogger().warn('HttpServer::_limiterSkip: request session isnt isUserLogin');
        }
        return false;
    }
    async _limiterLimit(request) {
        if (request.url.indexOf('/json/') === 0) {
            return 100;
        }
        return Number.MAX_SAFE_INTEGER;
    }
    async _limiterHandler(req, res) {
        Logger.getLogger().warn('HttpServer::_limiterHandler: Too Many Requests: %s is blocked for %s.', req.ip, req.url);
        res.status(429).json({ message: "Too Many Requests" });
    }
    async _generateCertAndKey() {
        const appTitle = Config.getInstance().getAppTitle();
        const keyPair = await CertificateHelper.generateKeyPair(2048);
        const certPair = await CertificateHelper.generateCertificate(keyPair.private, keyPair.public, [{
                name: 'commonName',
                value: appTitle
            }, {
                name: 'countryName',
                value: 'ZZ'
            }, {
                shortName: 'ST',
                value: 'None'
            }, {
                name: 'organizationName',
                value: appTitle
            }, {
                name: 'organizationalUnitName',
                value: appTitle
            }], [
            {
                name: 'basicConstraints',
                cA: true,
            },
            {
                name: 'keyUsage',
                keyCertSign: true,
                digitalSignature: true,
                nonRepudiation: true,
                keyEncipherment: true,
                dataEncipherment: true
            },
            {
                name: 'extKeyUsage',
                serverAuth: true,
                clientAuth: true,
                codeSigning: true,
                emailProtection: true,
                timeStamping: true
            },
            {
                name: 'nsCertType',
                client: true,
                server: true,
                email: true,
                objsign: true,
                sslCA: true,
                emailCA: true,
                objCA: true
            },
            {
                name: 'subjectAltName',
                altNames: [
                    {
                        type: 7,
                        ip: '127.0.0.1'
                    },
                    {
                        type: 7,
                        ip: '::1'
                    },
                    {
                        type: 2,
                        value: 'localhost'
                    },
                    {
                        type: 6,
                        value: 'https://localhost'
                    }
                ]
            },
            {
                name: 'subjectKeyIdentifier'
            }
        ]);
        return {
            key: certPair.privateKey,
            crt: certPair.cert
        };
    }
    async _getCertAndKey(options) {
        let ck = null;
        if (options.key && options.crt) {
            ck = await super._getCertAndKey(options);
        }
        else if (options.sslPath) {
            try {
                await DirHelper.mkdir(options.sslPath, true);
                ck = await super._getCertAndKey(options);
            }
            catch (e) {
                Logger.getLogger().error(`HttpServer::_getCertAndKey: Can not create key and cert by ssl path: ${options.sslPath}`);
            }
        }
        if (ck === null) {
            Logger.getLogger().error('HttpServer::_getCertAndKey: Key and Certificat can not read/parse by config! Create a temporary memory Key & Certificate');
            ck = await this._generateCertAndKey();
        }
        return ck;
    }
    getLimiter() {
        return this._limiter;
    }
    resetLimiterIP(ip) {
        if (this._limiter) {
            this._limiter.resetKey(ip);
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=HttpServer.js.map