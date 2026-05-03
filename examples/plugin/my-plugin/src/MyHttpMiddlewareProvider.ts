import {ProviderEntry} from 'figtree-schemas';
import {AProviderOnLoadEvent, IHttpMiddlewareProvider} from 'figtree';
import {RequestIdProvider} from './RequestIdProvider.js';

/**
 * Plugin event dispatched by `HttpMiddlewareProviders` to collect middleware.
 */
export class MyHttpMiddlewareProvider extends AProviderOnLoadEvent<ProviderEntry, IHttpMiddlewareProvider> {

    public getName(): string {
        return 'my-plugin-middleware';
    }

    public async getProviders(): Promise<IHttpMiddlewareProvider[]> {
        return [new RequestIdProvider()];
    }

}