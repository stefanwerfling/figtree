import {WebSocketEndpoint} from './WebSocketEndpoint.js';

/**
 * Subclass and override `loadEndpoints` to provide your application's
 * WebSocket endpoints to `HttpService`.
 *
 * @example
 *   class MyEndpointLoader extends WebSocketEndpointLoader {
 *       public static override async loadEndpoints(): Promise<WebSocketEndpoint[]> {
 *           return [new ChatEndpoint(), new NotifyEndpoint()];
 *       }
 *   }
 */
export class WebSocketEndpointLoader {

    public static async loadEndpoints(): Promise<WebSocketEndpoint<any, any>[]> {
        return [];
    }

}

/**
 * Class type — a constructor with the static `loadEndpoints()`.
 */
export type WebSocketEndpointLoaderType = {
    new(): WebSocketEndpointLoader;
    loadEndpoints(): Promise<WebSocketEndpoint<any, any>[]>;
};