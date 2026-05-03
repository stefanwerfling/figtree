import { ProviderEntry } from 'figtree-schemas';
import { BaseProviders } from '../../../Provider/BaseProviders.js';
import { IWebSocketEndpointProvider } from './IWebSocketEndpointProvider.js';
import { WebSocketEndpoint } from './WebSocketEndpoint.js';
export declare class WebSocketEndpointProviders extends BaseProviders<ProviderEntry, IWebSocketEndpointProvider> {
    constructor();
    getProvidersEndpoints(): Promise<WebSocketEndpoint<any, any>[]>;
}
