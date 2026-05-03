import {ProviderEntry} from 'figtree-schemas';
import {AProviderOnLoadEvent, IHttpRouteProvider} from 'figtree';
import {HelloHttpRouteProvider} from './HelloHttpRouteProvider.js';

/**
 * Plugin event dispatched by the host's `BaseProviders<...>` to collect
 * route providers.
 */
export class MyHttpRouteProvider extends AProviderOnLoadEvent<ProviderEntry, IHttpRouteProvider> {

    public getName(): string {
        return 'my-plugin';
    }

    public async getProviders(): Promise<IHttpRouteProvider[]> {
        return [new HelloHttpRouteProvider()];
    }

}