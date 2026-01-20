import { ProviderEntry } from 'figtree_schemas';
import { IProvider } from '../../Provider/IProvider.js';
import { HttpRouteLoaderType } from './HttpRouteLoader.js';
export interface IHttpRouteProvider extends IProvider<ProviderEntry> {
    getRouteLoader(): HttpRouteLoaderType;
}
