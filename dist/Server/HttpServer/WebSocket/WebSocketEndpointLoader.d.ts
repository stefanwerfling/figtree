import { WebSocketEndpoint } from './WebSocketEndpoint.js';
export declare class WebSocketEndpointLoader {
    static loadEndpoints(): Promise<WebSocketEndpoint<any, any>[]>;
}
export type WebSocketEndpointLoaderType = {
    new (): WebSocketEndpointLoader;
    loadEndpoints(): Promise<WebSocketEndpoint<any, any>[]>;
};
