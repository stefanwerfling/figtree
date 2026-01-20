import {ProviderEntry} from 'figtree_schemas';
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
        const list: IDefaultRoute[] = [];
        const providers = await this.getProviders();

        for (const provider of providers) {
            const routeLoader = provider.getRouteLoader();
            list.push(...await routeLoader.loadRoutes());
        }

        return list;
    }

}