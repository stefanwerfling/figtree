import { RequestHandler } from 'express';
import { ProviderEntry } from 'figtree-schemas';
import { BaseProviders } from '../../Provider/BaseProviders.js';
import { IHttpMiddlewareProvider } from './IHttpMiddlewareProvider.js';
export declare class HttpMiddlewareProviders extends BaseProviders<ProviderEntry, IHttpMiddlewareProvider> {
    constructor();
    getProvidersMiddleware(): Promise<RequestHandler[]>;
}
