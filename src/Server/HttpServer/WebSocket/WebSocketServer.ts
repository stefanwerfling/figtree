import {Duplex} from 'stream';
import {IncomingMessage} from 'http';
import {Request, RequestHandler, Response} from 'express';
import {SchemaErrors} from 'vts';
import {WebSocket, WebSocketServer as WsWebSocketServer} from 'ws';
import {ACL} from '../../../ACL/ACL.js';
import {Logger} from '../../../Logger/Logger.js';
import {BaseHttpServer} from '../BaseHttpServer.js';
import {WebSocketCloseCode} from './WebSocketCloseCode.js';
import {WebSocketContext, WebSocketEndpoint} from './WebSocketEndpoint.js';

/**
 * Options for `WebSocketServer`.
 */
export type WebSocketServerOptions = {
    /**
     * Heartbeat interval in ms. The server pings every connected client at
     * this interval and disconnects clients that fail to respond before the
     * next ping. Default 30_000 (30s). Set to 0 to disable.
     */
    heartbeatMs?: number;

    /**
     * Maximum size of a single incoming text message in bytes. Default 1 MB.
     * Larger payloads are rejected with `INVALID_PAYLOAD`.
     */
    maxPayloadBytes?: number;
};

const DEFAULT_HEARTBEAT_MS = 30_000;
const DEFAULT_MAX_PAYLOAD = 1024 * 1024;

/**
 * Mapping from path → endpoint definition. We keep the endpoint plus its
 * options pre-computed so the upgrade hot path doesn't recompute them.
 */
type EndpointEntry = {
    endpoint: WebSocketEndpoint<any, any>;
    path: string;
    options: ReturnType<WebSocketEndpoint<any, any>['getOptions']>;
};

/**
 * Map of WebSocket → context for endpoints with active heartbeats.
 */
type ConnectionState = {
    isAlive: boolean;
    endpoint: EndpointEntry;
    ctx: WebSocketContext;
};

/**
 * WebSocket server with session + ACL integration.
 *
 * Hangs off the existing `BaseHttpServer.getServer()` — it does not open its
 * own TCP socket. Endpoints route by URL path (exact match).
 */
export class WebSocketServer {

    private readonly _httpServer: BaseHttpServer;
    private readonly _wss: WsWebSocketServer;
    private readonly _heartbeatMs: number;
    private readonly _maxPayloadBytes: number;

    private readonly _endpoints = new Map<string, EndpointEntry>();
    private readonly _connections = new WeakMap<WebSocket, ConnectionState>();
    private readonly _activeSockets = new Set<WebSocket>();

    private _heartbeatTimer: NodeJS.Timeout | null = null;
    private _started = false;
    private _draining = false;
    private _upgradeListener: ((req: IncomingMessage, socket: Duplex, head: Buffer) => void) | null = null;

    /**
     * Constructor.
     * @param {BaseHttpServer} httpServer
     * @param {WebSocketServerOptions} options
     */
    public constructor(httpServer: BaseHttpServer, options: WebSocketServerOptions = {}) {
        this._httpServer = httpServer;
        this._heartbeatMs = options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
        this._maxPayloadBytes = options.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD;

        this._wss = new WsWebSocketServer({
            noServer: true,
            maxPayload: this._maxPayloadBytes
        });
    }

    /**
     * Register an endpoint. Must be called before `start()`.
     * @param {WebSocketEndpoint} endpoint
     */
    public addEndpoint(endpoint: WebSocketEndpoint<any, any>): void {
        if (this._started) {
            throw new Error('WebSocketServer::addEndpoint: cannot register after start()');
        }

        const path = endpoint.getPath();

        if (this._endpoints.has(path)) {
            throw new Error(`WebSocketServer::addEndpoint: duplicate path '${path}'`);
        }

        this._endpoints.set(path, {
            endpoint: endpoint,
            path: path,
            options: endpoint.getOptions()
        });
    }

    /**
     * Start the server — attaches an `'upgrade'` listener to the HTTP server
     * and starts the heartbeat timer (if enabled).
     */
    public start(): void {
        if (this._started) {
            return;
        }

        const server = this._httpServer.getServer();

        if (!server) {
            throw new Error('WebSocketServer::start: HTTP server is not initialized');
        }

        this._upgradeListener = (req, socket, head): void => {
            this._handleUpgrade(req, socket, head);
        };

        server.on('upgrade', this._upgradeListener);

        if (this._heartbeatMs > 0) {
            this._heartbeatTimer = setInterval(() => this._heartbeat(), this._heartbeatMs);
        }

        this._started = true;
    }

    /**
     * Stop the server: stop accepting new upgrades, close all sockets with
     * `SHUTDOWN` (1503), and clear the heartbeat timer.
     */
    public async stop(): Promise<void> {
        if (!this._started) {
            return;
        }

        this._draining = true;

        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }

        const server = this._httpServer.getServer();

        if (server && this._upgradeListener) {
            server.off('upgrade', this._upgradeListener);
            this._upgradeListener = null;
        }

        const sockets = Array.from(this._activeSockets);

        for (const ws of sockets) {
            try {
                ws.close(WebSocketCloseCode.SHUTDOWN, 'shutdown');
            } catch (err) {
                Logger.getLogger().warn('WebSocketServer::stop: close failed', err);
            }
        }

        await new Promise<void>((resolve) => {
            this._wss.close(() => {
                resolve();
            });
        });

        this._started = false;
        this._draining = false;
    }

    /** Number of currently connected clients. */
    public getClientCount(): number {
        return this._activeSockets.size;
    }

    /**
     * Per-tick heartbeat: ping every alive socket; terminate sockets that
     * failed to respond since the last tick.
     * @private
     */
    private _heartbeat(): void {
        for (const ws of this._activeSockets) {
            const state = this._connections.get(ws);

            if (!state) {
                continue;
            }

            if (!state.isAlive) {
                try {
                    ws.close(WebSocketCloseCode.HEARTBEAT_TIMEOUT, 'heartbeat timeout');
                } catch {
                    // ignore
                }

                ws.terminate();
                continue;
            }

            state.isAlive = false;

            try {
                ws.ping();
            } catch (err) {
                Logger.getLogger().warn('WebSocketServer::heartbeat: ping failed', err);
            }
        }
    }

    /**
     * Handle a single HTTP `upgrade`. Resolves the matching endpoint, runs
     * the session parser if required, performs the ACL check, and finally
     * completes the WS handshake.
     * @private
     */
    private _handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void {
        if (this._draining) {
            this._reject(socket, 503, 'Service Unavailable');
            return;
        }

        const url = req.url ?? '/';
        const path = url.split('?')[0];
        const entry = this._endpoints.get(path);

        if (!entry) {
            // Path not registered — let other upgrade listeners handle it.
            return;
        }

        const sessionParser = this._httpServer.getSessionParser();

        const finishWithSession = (): void => {
            this._authorizeAndAccept(entry, req as Request, socket, head);
        };

        if (entry.options.sessionSchema && sessionParser) {
            // Run the express-session middleware on the upgrade request so
            // `request.session` is populated before the auth check.
            this._runSessionParser(sessionParser, req as Request, finishWithSession);
        } else {
            finishWithSession();
        }
    }

    /**
     * Run the express-session middleware against the upgrade request. The
     * session-parser signature is `(req, res, next)`; we pass an empty fake
     * response so the parser can write headers (which we discard).
     * @private
     */
    private _runSessionParser(
        parser: RequestHandler,
        req: Request,
        next: () => void
    ): void {
        const fakeRes = {
            getHeader: (): undefined => undefined,
            setHeader: (): void => undefined,
            on: (): void => undefined,
            once: (): void => undefined,
            emit: (): boolean => true,
            end: (): void => undefined
        } as unknown as Response;

        try {
            parser(req, fakeRes, next);
        } catch (err) {
            Logger.getLogger().error('WebSocketServer::sessionParser failed', err);
            next();
        }
    }

    /**
     * Validate session + ACL, then perform the handshake.
     * @private
     */
    private _authorizeAndAccept(
        entry: EndpointEntry,
        req: Request,
        socket: Duplex,
        head: Buffer
    ): void {
        const opts = entry.options;

        if (opts.sessionSchema) {
            const errors: SchemaErrors = [];

            if (!opts.sessionSchema.validate(req.session, errors)) {
                this._reject(socket, 401, 'Unauthorized');
                return;
            }
        }

        const finishHandshake = (): void => {
            this._wss.handleUpgrade(req, socket, head, (ws) => {
                this._onConnection(ws, req, entry);
            });
        };

        if (opts.aclRight) {
            const session = req.session as { user?: { role?: string; }; } | undefined;
            const role = session?.user?.role;

            if (!role) {
                this._reject(socket, 401, 'Unauthorized');
                return;
            }

            ACL.getInstance().checkAccess(role, opts.aclRight)
            .then((ok) => {
                if (ok) {
                    finishHandshake();
                } else {
                    this._reject(socket, 403, 'Forbidden');
                }
            })
            .catch((err) => {
                Logger.getLogger().error('WebSocketServer::ACL check failed', err);
                this._reject(socket, 500, 'Internal Server Error');
            });

            return;
        }

        finishHandshake();
    }

    /**
     * Wire up message / close / pong handlers and dispatch the endpoint's
     * `onConnect`.
     * @private
     */
    private _onConnection(ws: WebSocket, req: Request, entry: EndpointEntry): void {
        const ctx: WebSocketContext = {
            ws: ws,
            request: req,
            session: req.session as unknown,
            sessionId: req.session?.id,
            path: entry.path
        };

        this._activeSockets.add(ws);
        this._connections.set(ws, { isAlive: true, endpoint: entry, ctx: ctx });

        ws.on('pong', () => {
            const state = this._connections.get(ws);

            if (state) {
                state.isAlive = true;
            }
        });

        ws.on('message', (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
            if (isBinary) {
                this._closeWith(ws, WebSocketCloseCode.INVALID_PAYLOAD, 'binary not supported');
                return;
            }

            const text = data.toString();

            this._dispatchMessage(ws, entry, ctx, text).catch((err) => {
                Logger.getLogger().error(`WebSocketServer::dispatchMessage error on '${entry.path}'`, err);
            });
        });

        ws.on('close', (code: number, reason: Buffer) => {
            this._activeSockets.delete(ws);
            this._connections.delete(ws);

            entry.endpoint.onClose(ctx, code, reason.toString()).catch((err) => {
                Logger.getLogger().error(`WebSocketServer::onClose error on '${entry.path}'`, err);
            });
        });

        ws.on('error', (err) => {
            Logger.getLogger().warn(`WebSocketServer::error on '${entry.path}'`, err);
        });

        entry.endpoint.onConnect(ctx).catch((err) => {
            Logger.getLogger().error(`WebSocketServer::onConnect error on '${entry.path}'`, err);
            this._closeWith(ws, WebSocketCloseCode.POLICY_VIOLATION, 'onConnect failed');
        });
    }

    /**
     * Parse + validate an incoming text message and dispatch the endpoint's
     * `onMessage`. Closes the socket with `INVALID_PAYLOAD` on parse or
     * schema failure.
     * @private
     */
    private async _dispatchMessage(
        ws: WebSocket,
        entry: EndpointEntry,
        ctx: WebSocketContext,
        text: string
    ): Promise<void> {
        let payload: unknown;

        try {
            payload = JSON.parse(text);
        } catch {
            this._closeWith(ws, WebSocketCloseCode.INVALID_PAYLOAD, 'invalid JSON');
            return;
        }

        if (entry.options.bodySchema) {
            const errors: SchemaErrors = [];

            if (!entry.options.bodySchema.validate(payload, errors)) {
                this._closeWith(ws, WebSocketCloseCode.INVALID_PAYLOAD, 'schema validation failed');
                return;
            }
        }

        try {
            await entry.endpoint.onMessage(ctx, payload);
        } catch (err) {
            Logger.getLogger().error(`WebSocketServer::onMessage error on '${entry.path}'`, err);
        }
    }

    /**
     * Reject an unaccepted upgrade with a tiny HTTP response. The connection
     * is then destroyed.
     * @private
     */
    private _reject(socket: Duplex, status: number, reason: string): void {
        try {
            socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
        } catch {
            // socket may already be closed
        }

        socket.destroy();
    }

    /**
     * Close a connected socket with a specific close code and reason.
     * @private
     */
    private _closeWith(ws: WebSocket, code: number, reason: string): void {
        try {
            ws.close(code, reason);
        } catch {
            try {
                ws.terminate();
            } catch {
                // ignore
            }
        }
    }

}