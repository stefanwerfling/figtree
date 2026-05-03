import {WebSocketEndpoint, WebSocketEndpointLoader, WebSocketEndpointProviders} from 'figtree';

/**
 * Endpoint loader for the host — pulls in everything contributed by plugins
 * via `WebSocketEndpointProviders`.
 */
export class ExampleWebSocketEndpointLoader extends WebSocketEndpointLoader {

    public static override async loadEndpoints(): Promise<WebSocketEndpoint<any, any>[]> {
        const providers = new WebSocketEndpointProviders();
        return providers.getProvidersEndpoints();
    }

}