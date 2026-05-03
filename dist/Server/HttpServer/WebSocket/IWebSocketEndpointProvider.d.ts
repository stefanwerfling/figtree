import { ProviderEntry } from 'figtree-schemas';
import { IProvider } from '../../../Provider/IProvider.js';
import { WebSocketEndpointLoaderType } from './WebSocketEndpointLoader.js';
export interface IWebSocketEndpointProvider extends IProvider<ProviderEntry> {
    getEndpointLoader(): WebSocketEndpointLoaderType;
}
