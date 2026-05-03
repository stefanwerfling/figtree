import {ProviderEntry} from 'figtree-schemas';
import {AProviderOnLoadEvent, IWebSocketEndpointProvider} from 'figtree';
import {EchoWebSocketEndpointProvider} from './EchoWebSocketEndpointProvider.js';

/**
 * Plugin event dispatched by `WebSocketEndpointProviders` to collect WS
 * endpoint loaders.
 */
export class MyWebSocketEndpointProvider extends AProviderOnLoadEvent<ProviderEntry, IWebSocketEndpointProvider> {

    public getName(): string {
        return 'my-plugin-ws';
    }

    public async getProviders(): Promise<IWebSocketEndpointProvider[]> {
        return [new EchoWebSocketEndpointProvider()];
    }

}