import {ProviderEntry} from 'figtree-schemas';
import {BaseProviders} from '../../Provider/BaseProviders.js';
import {HttpRouteProviderType} from './HttpRouteProviderType.js';
import {IHttpRouteProvider} from './IHttpRouteProvider.js';
import {IDefaultRoute} from './Routes/IDefaultRoute.js';

/**
 * Http route-providers
 */
export class HttpRouteProviders extends BaseProviders<ProviderEntry, IHttpRouteProvider> {

    /**
     * Constructor
     */
    public constructor() {
        super(HttpRouteProviderType);
    }

    /**
     * Return all routes by all providers
     * @return {IDefaultRoute[]}
     */
    public async getProvidersRoutes(): Promise<IDefaultRoute[]> {
        const providers = await this.getProviders();
        const routeLists = await Promise.all(
            providers.map((provider) => provider.getRouteLoader().loadRoutes())
        );

        return routeLists.flat();
    }

}