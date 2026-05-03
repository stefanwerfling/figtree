import { BaseHttpServer } from '../BaseHttpServer.js';
import { WebSocketEndpoint } from './WebSocketEndpoint.js';
export type WebSocketServerOptions = {
    heartbeatMs?: number;
    maxPayloadBytes?: number;
};
export declare class WebSocketServer {
    private readonly _httpServer;
    private readonly _wss;
    private readonly _heartbeatMs;
    private readonly _maxPayloadBytes;
    private readonly _endpoints;
    private readonly _connections;
    private readonly _activeSockets;
    private _heartbeatTimer;
    private _started;
    private _draining;
    private _upgradeListener;
    constructor(httpServer: BaseHttpServer, options?: WebSocketServerOptions);
    addEndpoint(endpoint: WebSocketEndpoint<any, any>): void;
    start(): void;
    stop(): Promise<void>;
    getClientCount(): number;
    private _heartbeat;
    private _handleUpgrade;
    private _runSessionParser;
    private _authorizeAndAccept;
    private _onConnection;
    private _dispatchMessage;
    private _reject;
    private _closeWith;
}
