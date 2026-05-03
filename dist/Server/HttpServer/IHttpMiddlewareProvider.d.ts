import { RequestHandler } from 'express';
import { ProviderEntry } from 'figtree-schemas';
import { IProvider } from '../../Provider/IProvider.js';
export interface IHttpMiddlewareProvider extends IProvider<ProviderEntry> {
    getMiddleware(): RequestHandler | RequestHandler[] | Promise<RequestHandler | RequestHandler[]>;
}
