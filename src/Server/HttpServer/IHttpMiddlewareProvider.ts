import {RequestHandler} from 'express';
import {ProviderEntry} from 'figtree-schemas';
import {IProvider} from '../../Provider/IProvider.js';

/**
 * Interface for an HTTP middleware provider — a plugin contributing one or
 * more Express middleware handlers that should run on every request before
 * the application routes are evaluated.
 *
 * Multiple providers run in registration order. Each provider's middleware
 * is `app.use()`-d after the standard pre-route middleware (body, cookies,
 * CSRF, session) and before the application's own routes.
 */
export interface IHttpMiddlewareProvider extends IProvider<ProviderEntry> {

    /**
     * Return one or more Express middleware functions. May be sync or async.
     * @return {RequestHandler|RequestHandler[]}
     */
    getMiddleware(): RequestHandler | RequestHandler[] | Promise<RequestHandler | RequestHandler[]>;

}