import {IProvider} from '../../Provider/IProvider.js';
import {ProviderEntry} from '../../Schemas/Provider/ProviderEntry.js';
import {HttpRouteLoaderType} from './HttpRouteLoader.js';

/**
 * Interface http route provider
 */
export interface IHttpRouteProvider extends IProvider<ProviderEntry> {
    
    /**
     * Return the route loader class
     * @return {HttpRouteLoaderType}
     */
    getRouteLoader(): HttpRouteLoaderType;

}