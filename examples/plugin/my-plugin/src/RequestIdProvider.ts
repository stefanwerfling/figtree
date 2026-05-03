import {randomUUID} from 'crypto';
import {RequestHandler} from 'express';
import {ProviderEntry} from 'figtree-schemas';
import {HttpMiddlewareProviderType, IHttpMiddlewareProvider} from 'figtree';

/**
 * Adds an `X-Request-Id` response header on every request. If the client
 * already sent the header, it is preserved; otherwise a fresh UUID is used.
 */
const requestIdMiddleware: RequestHandler = (req, res, next) => {
    const incoming = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();

    res.setHeader('X-Request-Id', incoming);
    req.headers['x-request-id'] = incoming;
    next();
};

export class RequestIdProvider implements IHttpMiddlewareProvider {

    public getName(): string {
        return 'my-plugin-middleware';
    }

    public getTitle(): string {
        return 'Demo Plugin Middleware';
    }

    public getType(): string {
        return HttpMiddlewareProviderType;
    }

    public getProviderEntry(): ProviderEntry {
        return {
            name: this.getName(),
            title: this.getTitle()
        };
    }

    public getMiddleware(): RequestHandler {
        return requestIdMiddleware;
    }

}