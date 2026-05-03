import { ServiceImportance } from 'figtree-schemas';
import { HttpRouteLoaderType } from '../../Server/HttpServer/HttpRouteLoader.js';
import { HttpServer } from '../../Server/HttpServer/HttpServer.js';
import { WebSocketEndpointLoaderType } from '../../Server/HttpServer/WebSocket/WebSocketEndpointLoader.js';
import { WebSocketServer, WebSocketServerOptions } from '../../Server/HttpServer/WebSocket/WebSocketServer.js';
import { ServiceAbstract } from '../../Service/ServiceAbstract.js';
export type HttpServiceWebSocketOptions = {
    loader: WebSocketEndpointLoaderType;
    server?: WebSocketServerOptions;
};
export declare class HttpService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    protected _loader: HttpRouteLoaderType;
    protected _wsOptions?: HttpServiceWebSocketOptions;
    protected _server: HttpServer | null;
    protected _wsServer: WebSocketServer | null;
    constructor(loader: HttpRouteLoaderType, serviceName?: string, serviceDependencies?: string[], wsOptions?: HttpServiceWebSocketOptions);
    getServer(): HttpServer | null;
    getWebSocketServer(): WebSocketServer | null;
    start(): Promise<void>;
    stop(): Promise<void>;
}
