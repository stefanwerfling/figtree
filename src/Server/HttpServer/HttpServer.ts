import rateLimit, {RateLimitRequestHandler} from 'express-rate-limit';
import {SchemaRequestData} from 'figtree-schemas';
import helmet from 'helmet';
import {Request, Response} from 'express';
import {Config} from '../../Config/Config.js';
import {CertificateHelper} from '../../Crypto/CertificateHelper.js';
import {Logger} from '../../Logger/Logger.js';
import {DirHelper} from '../../Utils/DirHelper.js';
import {BaseHttpCertKey, BaseHttpServer, BaseHttpServerOptionCrypt} from './BaseHttpServer.js';
import {Session} from './Session.js';

/**
 * HttpServer
 */
export class HttpServer extends BaseHttpServer {

    /**
     * Limiter
     * @protected
     */
    protected _limiter: RateLimitRequestHandler|null = null;

    /**
     * _initServer
     * @protected
     */
    protected _initExpressUsePre(): void {
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
            skip: async(request): Promise<boolean> => {
                return this._limiterSkip(request);
            },
            limit: async(request): Promise<number> => {
                return this._limiterLimit(request);
            },
            handler: async (req, res): Promise<void> => {
                return this._limiterHandler(req, res);
            }
        });

        this._express.use(this._limiter);
    }

    /**
     * limiter skip
     * @param {Request} request
     * @protected
     * @return {boolean}
     */
    protected async _limiterSkip(request: Request): Promise<boolean> {
        // allow all outsite session
        if (!request.url.startsWith('/json/')) {
            return true;
        }

        if (Session.isUserLogin(request.session as any)) {
            return true;
        } else {
            Logger.getLogger().warn('HttpServer::_limiterSkip: request session isnt isUserLogin');
        }

        return false;
    }

    /**
     * limiter limit
     * @param {Request} request
     * @protected
     * @return {number}
     */
    protected async _limiterLimit(request: Request): Promise<number> {
        if (request.url.indexOf('/json/') === 0) {
            return 100;
        }

        // File access for html/js/img etc. allow ever.
        return Number.MAX_SAFE_INTEGER;
    }

    /**
     * Limiter handler
     * @param {Request} req
     * @param {Response} res
     * @protected
     */
    protected async _limiterHandler(req: Request, res: Response): Promise<void> {
        Logger.getLogger().warn('HttpServer::_limiterHandler: Too Many Requests: %s is blocked for %s.', req.ip, req.url);

        res.status(429).json({ message: "Too Many Requests" });
    }

    /**
     * Generate Cert and Key
     * @return {BaseHttpCertKey}
     * @protected
     */
    protected async _generateCertAndKey(): Promise<BaseHttpCertKey> {
        const appTitle = Config.getInstance().getAppTitle();
        const keyPair = await CertificateHelper.generateKeyPair(2048);
        const certPair = await CertificateHelper.generateCertificate(
            keyPair.private,
            keyPair.public,
            [{
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
            }],
            [
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
                            // IP
                            type: 7,
                            ip: '127.0.0.1'
                        },
                        {
                            // IP6
                            type: 7,
                            ip: '::1'
                        },
                        {
                            // DNS
                            type: 2,
                            value: 'localhost'
                        },
                        {
                            // URI
                            type: 6,
                            value: 'https://localhost'
                        }
                    ]
                },
                {
                    name: 'subjectKeyIdentifier'
                }
            ]
        );

        return {
            key: certPair.privateKey,
            crt: certPair.cert
        };
    }

    /**
     * Get Cert and key
     * @param {BaseHttpServerOptionCrypt} options
     * @return {BaseHttpCertKey|null}
     * @protected
     */
    protected async _getCertAndKey(options: BaseHttpServerOptionCrypt): Promise<BaseHttpCertKey|null> {
        let ck: BaseHttpCertKey|null = null;

        if (options.key && options.crt) {
            ck = await super._getCertAndKey(options);
        } else if(options.sslPath) {
            try {
                await DirHelper.mkdir(options.sslPath, true);
                ck = await super._getCertAndKey(options);
            } catch (e) {
                Logger.getLogger().error(`HttpServer::_getCertAndKey: Can not create key and cert by ssl path: ${options.sslPath}`);
            }
        }

        // -------------------------------------------------------------------------------------------------------------

        if(ck === null) {
            Logger.getLogger().error(
                'HttpServer::_getCertAndKey: Key and Certificat can not read/parse by config! Create a temporary memory Key & Certificate'
            );

            ck = await this._generateCertAndKey();
        }

        return ck;
    }

    /**
     * Return the Limiter
     * @return {}
     */
    public getLimiter(): RateLimitRequestHandler|null {
        return this._limiter;
    }

    /**
     * Reset the limiter for IP
     * @param {string} ip
     * @return {boolean}
     */
    public resetLimiterIP(ip: string): boolean {
        if (this._limiter) {
            this._limiter.resetKey(ip);
            return true;
        }

        return false;
    }
}