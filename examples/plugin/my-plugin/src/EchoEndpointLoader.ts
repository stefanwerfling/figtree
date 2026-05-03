import {WebSocketEndpoint, WebSocketEndpointLoader} from 'figtree';
import {EchoWebSocketEndpoint} from './EchoWebSocketEndpoint.js';

export class EchoEndpointLoader extends WebSocketEndpointLoader {

    public static override async loadEndpoints(): Promise<WebSocketEndpoint<any, any>[]> {
        return [new EchoWebSocketEndpoint()];
    }

}