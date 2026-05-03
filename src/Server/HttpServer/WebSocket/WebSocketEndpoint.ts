import {Request} from 'express';
import {ObjectSchema} from 'vts';
import {WebSocket} from 'ws';

/**
 * Context passed to every WebSocket handler.
 *
 * @template TSession
 */
export type WebSocketContext<TSession = unknown> = {
    /** The underlying ws connection. */
    ws: WebSocket;

    /** The HTTP upgrade request. Use this to read query params, headers, etc. */
    request: Request;

    /**
     * The express-session data, populated when the endpoint declares a
     * `sessionSchema` and the upgrade passed the session check.
     */
    session?: TSession;

    /** Stable session id (matches `req.session.id`) when a session exists. */
    sessionId?: string;

    /** The matched endpoint path. */
    path: string;
};

/**
 * Options declared by a `WebSocketEndpoint`.
 *
 * @template TBody
 * @template TSession
 */
export type WebSocketEndpointOptions<TBody = unknown, TSession = unknown> = {
    /**
     * Schema for incoming text messages (JSON-decoded). When set, every
     * message is parsed as JSON and validated; on validation failure the
     * server replies with an INVALID_PAYLOAD close and the client is
     * disconnected.
     */
    bodySchema?: ObjectSchema<any>;

    /**
     * Schema for the express session. When set, the upgrade request runs
     * through the session parser and is rejected with 401 Unauthorized when
     * the parsed session does not validate.
     *
     * Type-only. Used to type `ctx.session` in handlers.
     */
    sessionSchema?: ObjectSchema<any>;

    /** Required ACL right (resolved against `ACL.getInstance().checkAccess`). */
    aclRight?: string;

    /** Description for documentation purposes. */
    description?: string;

    // Phantom type tags so TBody / TSession survive into the handler.
    /** @internal */
    readonly __body?: TBody;
    /** @internal */
    readonly __session?: TSession;
};

/**
 * Abstract base class for WebSocket endpoints. Subclass and override one or
 * more of `onConnect` / `onMessage` / `onClose`.
 *
 * @example
 *   class ChatEndpoint extends WebSocketEndpoint<ChatMessage, MySession> {
 *       public getPath(): string { return '/ws/v1/chat'; }
 *
 *       public getOptions(): WebSocketEndpointOptions<ChatMessage, MySession> {
 *           return {
 *               bodySchema: SchemaChatMessage,
 *               sessionSchema: SchemaMySession,
 *               aclRight: 'chat'
 *           };
 *       }
 *
 *       public override async onMessage(ctx, msg): Promise<void> {
 *           ctx.ws.send(JSON.stringify({ echo: msg }));
 *       }
 *   }
 *
 * @template TBody
 * @template TSession
 */
export abstract class WebSocketEndpoint<TBody = unknown, TSession = unknown> {

    /** Path the endpoint listens on, e.g. `/ws/v1/chat`. */
    public abstract getPath(): string;

    /** Endpoint configuration — schemas, ACL, description. */
    public abstract getOptions(): WebSocketEndpointOptions<TBody, TSession>;

    /** Called once when a client successfully connects. */
    public async onConnect(_ctx: WebSocketContext<TSession>): Promise<void> {
        // override in subclass
    }

    /**
     * Called for every incoming text message. The body is JSON-decoded and
     * (if `bodySchema` is set) validated before this fires.
     */
    public async onMessage(
        _ctx: WebSocketContext<TSession>,
        _body: TBody
    ): Promise<void> {
        // override in subclass
    }

    /** Called when the connection is closed (cleanly or otherwise). */
    public async onClose(
        _ctx: WebSocketContext<TSession>,
        _code: number,
        _reason: string
    ): Promise<void> {
        // override in subclass
    }

}