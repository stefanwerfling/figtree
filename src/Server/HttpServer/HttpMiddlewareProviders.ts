import {RequestHandler} from 'express';
import {ProviderEntry} from 'figtree-schemas';
import {BaseProviders} from '../../Provider/BaseProviders.js';
import {HttpMiddlewareProviderType} from './HttpMiddlewareProviderType.js';
import {IHttpMiddlewareProvider} from './IHttpMiddlewareProvider.js';

/**
 * Collects HTTP middleware from all loaded plugins.
 */
export class HttpMiddlewareProviders extends BaseProviders<ProviderEntry, IHttpMiddlewareProvider> {

    public constructor() {
        super(HttpMiddlewareProviderType);
    }

    /**
     * Return the flattened list of middleware handlers from every registered
     * provider, in the order their providers were registered. Each provider's
     * `getMiddleware()` may return a single handler or an array.
     * @return {RequestHandler[]}
     */
    public async getProvidersMiddleware(): Promise<RequestHandler[]> {
        const providers = await this.getProviders();
        const lists = await Promise.all(providers.map(async(p) => {
            const mw = await p.getMiddleware();
            return Array.isArray(mw) ? mw : [mw];
        }));

        return lists.flat();
    }

}