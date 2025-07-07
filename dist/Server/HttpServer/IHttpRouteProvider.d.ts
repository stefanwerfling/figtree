import { IProvider } from '../../Provider/IProvider.js';
import { ProviderEntry } from '../../Schemas/Provider/ProviderEntry.js';
import { HttpRouteLoaderType } from './HttpRouteLoader.js';
export interface IHttpRouteProvider extends IProvider<ProviderEntry> {
    getRouteLoader(): HttpRouteLoaderType;
}
