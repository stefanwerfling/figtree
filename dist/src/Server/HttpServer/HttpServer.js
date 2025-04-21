import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Logger } from '../../Logger/Logger.js';
import { SchemaRequestData } from '../../Schemas/Server/RequestData.js';
import { BaseHttpServer } from './BaseHttpServer.js';
import { Session } from './Session.js';
export class HttpServer extends BaseHttpServer {
    _initServer() {
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
        this._express.use(limiter);
    }
    async _limiterSkip(request) {
        if (request.url.indexOf('/json/') === 0) {
            if (SchemaRequestData.validate(request, []) && Session.isUserLogin(request.session)) {
                return true;
            }
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
}
//# sourceMappingURL=HttpServer.js.map