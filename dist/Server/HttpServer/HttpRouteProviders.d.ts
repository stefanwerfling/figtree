import { ProviderEntry } from 'figtree-schemas';
import { BaseProviders } from '../../Provider/BaseProviders.js';
import { IHttpRouteProvider } from './IHttpRouteProvider.js';
import { IDefaultRoute } from './Routes/IDefaultRoute.js';
export declare class HttpRouteProviders extends BaseProviders<ProviderEntry, IHttpRouteProvider> {
    constructor();
    getProvidersRoutes(): Promise<IDefaultRoute[]>;
}
