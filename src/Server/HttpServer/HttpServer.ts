import rateLimit, {RateLimitRequestHandler} from 'express-rate-limit';
import helmet from 'helmet';
import {Request, Response} from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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
            directives: this._getCspDirectives()
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
            handler: async(req, res): Promise<void> => {
                return this._limiterHandler(req, res);
            }
        });

        this._express.use('/json/', this._limiter);
    }

    /**
     * Return CSP directives for helmet.contentSecurityPolicy.
     * Override in a subclass to extend or replace the default policy.
     * @protected
     */
    protected _getCspDirectives(): Record<string, string[]> {
        return {
            defaultSrc: ['\'self\''],
            connectSrc: ['\'self\''],
            frameSrc:   ['\'self\''],
            childSrc:   ['\'self\''],
            scriptSrc:  ['\'self\'', '\'unsafe-inline\''],
            styleSrc:   ['\'self\'', '\'unsafe-inline\''],
            fontSrc:    ['\'self\''],
            imgSrc:     ['\'self\'', 'https: data:'],
            baseUri:    ['\'self\'']
        };
    }

    /**
     * limiter skip
     * @param {Request} request
     * @protected
     * @return {boolean}
     */
    protected async _limiterSkip(request: Request): Promise<boolean> {
        return Session.isUserLogin(request.session as any);
    }

    /**
     * limiter limit
     * @param {Request} _request
     * @protected
     * @return {number}
     */
    protected async _limiterLimit(_request: Request): Promise<number> {
        return 100;
    }

    /**
     * Limiter handler
     * @param {Request} req
     * @param {Response} res
     * @protected
     */
    protected async _limiterHandler(req: Request, res: Response): Promise<void> {
        Logger.getLogger().warn('HttpServer::_limiterHandler: Too Many Requests: %s is blocked for %s.', req.ip, req.url);

        res.status(429).json({ message: 'Too Many Requests' });
    }

    /**
     * Build the subjectAltName list for the generated temporary certificate:
     * the usual loopback entries plus the machine's own hostname, so a
     * self-signed cert is also valid when reached by that name (e.g. a
     * container's compose/k8s service DNS name) instead of only localhost.
     * @return {Array<{type: number; ip?: string; value?: string}>}
     * @private
     */
    private static _buildSubjectAltNames(): Array<{type: number; ip?: string; value?: string}> {
        const altNames: Array<{type: number; ip?: string; value?: string}> = [
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
        ];

        const hostname = os.hostname();

        if (hostname && hostname !== 'localhost') {
            altNames.push({
                type: 2,
                value: hostname
            });
        }

        return altNames;
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
                    // Includes the machine's own hostname (e.g. a Docker container's
                    // hostname, which compose/k8s also register as the resolvable
                    // service DNS name on the internal network) so other services
                    // reaching this server by that name - not just localhost - still
                    // pass hostname verification against this self-signed cert.
                    altNames: HttpServer._buildSubjectAltNames()
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
     *
     * When `sslPath` is set together with `key`/`crt`, those are treated as
     * filenames inside `sslPath` (not PEM strings/absolute paths) and joined
     * before the lookup, so a persisted cert on disk is actually found on
     * restart. If nothing is found there, a temporary self-signed cert is
     * generated and — when `sslPath` is set — persisted to that same location,
     * so it survives process restarts instead of being re-generated (with a
     * new key) on every boot.
     * @param {BaseHttpServerOptionCrypt} options
     * @return {BaseHttpCertKey|null}
     * @protected
     */
    protected async _getCertAndKey(options: BaseHttpServerOptionCrypt): Promise<BaseHttpCertKey|null> {
        let ck: BaseHttpCertKey|null = null;

        if (options.sslPath && options.key && options.crt) {
            try {
                await DirHelper.mkdir(options.sslPath, true);

                ck = await super._getCertAndKey({
                    sslPath: options.sslPath,
                    key: path.join(options.sslPath, options.key),
                    crt: path.join(options.sslPath, options.crt)
                });
            } catch (_e) {
                Logger.getLogger().error(`HttpServer::_getCertAndKey: Can not create key and cert by ssl path: ${options.sslPath}`);
            }
        } else if (options.key && options.crt) {
            ck = await super._getCertAndKey(options);
        }

        // -------------------------------------------------------------------------------------------------------------

        if(ck === null) {
            Logger.getLogger().error(
                'HttpServer::_getCertAndKey: Key and Certificat can not read/parse by config! Create a temporary memory Key & Certificate'
            );

            ck = await this._generateCertAndKey();

            if (options.sslPath && options.key && options.crt) {
                try {
                    await fs.writeFile(path.join(options.sslPath, options.key), ck.key);
                    await fs.writeFile(path.join(options.sslPath, options.crt), ck.crt);
                } catch (_e) {
                    Logger.getLogger().warn(
                        `HttpServer::_getCertAndKey: Could not persist the generated temporary certificate to ssl path: ${options.sslPath}`
                    );
                }
            }
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