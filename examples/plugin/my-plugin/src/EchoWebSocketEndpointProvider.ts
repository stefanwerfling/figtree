import {ProviderEntry} from 'figtree-schemas';
import {
    IWebSocketEndpointProvider,
    WebSocketEndpointLoaderType,
    WebSocketEndpointProviderType
} from 'figtree';
import {EchoEndpointLoader} from './EchoEndpointLoader.js';

export class EchoWebSocketEndpointProvider implements IWebSocketEndpointProvider {

    public getName(): string {
        return 'my-plugin-ws';
    }

    public getTitle(): string {
        return 'Demo Plugin WebSocket Endpoint';
    }

    public getType(): string {
        return WebSocketEndpointProviderType;
    }

    public getProviderEntry(): ProviderEntry {
        return {
            name: this.getName(),
            title: this.getTitle()
        };
    }

    public getEndpointLoader(): WebSocketEndpointLoaderType {
        return EchoEndpointLoader;
    }

}