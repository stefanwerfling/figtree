import {ProviderEntry} from 'figtree-schemas';
import {BaseProviders} from '../../../Provider/BaseProviders.js';
import {IWebSocketEndpointProvider} from './IWebSocketEndpointProvider.js';
import {WebSocketEndpoint} from './WebSocketEndpoint.js';
import {WebSocketEndpointProviderType} from './WebSocketEndpointProviderType.js';

/**
 * Collects WebSocket endpoints from all loaded plugins.
 */
export class WebSocketEndpointProviders extends BaseProviders<ProviderEntry, IWebSocketEndpointProvider> {

    public constructor() {
        super(WebSocketEndpointProviderType);
    }

    /**
     * Return the flattened endpoint list contributed by every registered
     * provider, in registration order.
     * @return {WebSocketEndpoint[]}
     */
    public async getProvidersEndpoints(): Promise<WebSocketEndpoint<any, any>[]> {
        const providers = await this.getProviders();
        const lists = await Promise.all(
            providers.map((p) => p.getEndpointLoader().loadEndpoints())
        );

        return lists.flat();
    }

}