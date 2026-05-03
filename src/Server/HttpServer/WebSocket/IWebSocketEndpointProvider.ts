import {ProviderEntry} from 'figtree-schemas';
import {IProvider} from '../../../Provider/IProvider.js';
import {WebSocketEndpointLoaderType} from './WebSocketEndpointLoader.js';

/**
 * Plugin-provided source of WebSocket endpoints — analog to
 * `IHttpRouteProvider`. Each provider returns a `WebSocketEndpointLoader`
 * class whose static `loadEndpoints()` resolves the endpoint instances.
 */
export interface IWebSocketEndpointProvider extends IProvider<ProviderEntry> {

    /**
     * Return the endpoint-loader class.
     * @return {WebSocketEndpointLoaderType}
     */
    getEndpointLoader(): WebSocketEndpointLoaderType;

}