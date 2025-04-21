import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import {Request, Response} from 'express';
import {Logger} from '../../Logger/Logger.js';
import {SchemaRequestData} from '../../Schemas/Server/RequestData.js';
import {BaseHttpServer} from './BaseHttpServer.js';
import {Session} from './Session.js';

export class HttpServer extends BaseHttpServer {

    /**
     * _initServer
     * @protected
     */
    protected _initServer(): void {
        super._initServer();

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

        const limiter = rateLimit({
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

        this._express.use(limiter);
    }

    /**
     * limiter skip
     * @param {Request} request
     * @protected
     * @return {boolean}
     */
    protected async _limiterSkip(request: Request): Promise<boolean> {
        if (request.url.indexOf('/json/') === 0) {
            if (SchemaRequestData.validate(request, []) && Session.isUserLogin(request.session)) {
                return true;
            }
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
}