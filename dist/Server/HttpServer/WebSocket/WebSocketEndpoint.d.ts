import { Request } from 'express';
import { ObjectSchema } from 'vts';
import { WebSocket } from 'ws';
export type WebSocketContext<TSession = unknown> = {
    ws: WebSocket;
    request: Request;
    session?: TSession;
    sessionId?: string;
    path: string;
};
export type WebSocketEndpointOptions<TBody = unknown, TSession = unknown> = {
    bodySchema?: ObjectSchema<any>;
    sessionSchema?: ObjectSchema<any>;
    aclRight?: string;
    description?: string;
    readonly __body?: TBody;
    readonly __session?: TSession;
};
export declare abstract class WebSocketEndpoint<TBody = unknown, TSession = unknown> {
    abstract getPath(): string;
    abstract getOptions(): WebSocketEndpointOptions<TBody, TSession>;
    onConnect(_ctx: WebSocketContext<TSession>): Promise<void>;
    onMessage(_ctx: WebSocketContext<TSession>, _body: TBody): Promise<void>;
    onClose(_ctx: WebSocketContext<TSession>, _code: number, _reason: string): Promise<void>;
}
