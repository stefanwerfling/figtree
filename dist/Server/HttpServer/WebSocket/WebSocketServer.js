import { WebSocketServer as WsWebSocketServer } from 'ws';
import { ACL } from '../../../ACL/ACL.js';
import { Logger } from '../../../Logger/Logger.js';
import { WebSocketCloseCode } from './WebSocketCloseCode.js';
const DEFAULT_HEARTBEAT_MS = 30_000;
const DEFAULT_MAX_PAYLOAD = 1024 * 1024;
export class WebSocketServer {
    _httpServer;
    _wss;
    _heartbeatMs;
    _maxPayloadBytes;
    _endpoints = new Map();
    _connections = new WeakMap();
    _activeSockets = new Set();
    _heartbeatTimer = null;
    _started = false;
    _draining = false;
    _upgradeListener = null;
    constructor(httpServer, options = {}) {
        this._httpServer = httpServer;
        this._heartbeatMs = options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
        this._maxPayloadBytes = options.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD;
        this._wss = new WsWebSocketServer({
            noServer: true,
            maxPayload: this._maxPayloadBytes
        });
    }
    addEndpoint(endpoint) {
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
    start() {
        if (this._started) {
            return;
        }
        const server = this._httpServer.getServer();
        if (!server) {
            throw new Error('WebSocketServer::start: HTTP server is not initialized');
        }
        this._upgradeListener = (req, socket, head) => {
            this._handleUpgrade(req, socket, head);
        };
        server.on('upgrade', this._upgradeListener);
        if (this._heartbeatMs > 0) {
            this._heartbeatTimer = setInterval(() => this._heartbeat(), this._heartbeatMs);
        }
        this._started = true;
    }
    async stop() {
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
            }
            catch (err) {
                Logger.getLogger().warn('WebSocketServer::stop: close failed', err);
            }
        }
        await new Promise((resolve) => {
            this._wss.close(() => {
                resolve();
            });
        });
        this._started = false;
        this._draining = false;
    }
    getClientCount() {
        return this._activeSockets.size;
    }
    _heartbeat() {
        for (const ws of this._activeSockets) {
            const state = this._connections.get(ws);
            if (!state) {
                continue;
            }
            if (!state.isAlive) {
                try {
                    ws.close(WebSocketCloseCode.HEARTBEAT_TIMEOUT, 'heartbeat timeout');
                }
                catch {
                }
                ws.terminate();
                continue;
            }
            state.isAlive = false;
            try {
                ws.ping();
            }
            catch (err) {
                Logger.getLogger().warn('WebSocketServer::heartbeat: ping failed', err);
            }
        }
    }
    _handleUpgrade(req, socket, head) {
        if (this._draining) {
            this._reject(socket, 503, 'Service Unavailable');
            return;
        }
        const url = req.url ?? '/';
        const path = url.split('?')[0];
        const entry = this._endpoints.get(path);
        if (!entry) {
            return;
        }
        const sessionParser = this._httpServer.getSessionParser();
        const finishWithSession = () => {
            this._authorizeAndAccept(entry, req, socket, head);
        };
        if (entry.options.sessionSchema && sessionParser) {
            this._runSessionParser(sessionParser, req, finishWithSession);
        }
        else {
            finishWithSession();
        }
    }
    _runSessionParser(parser, req, next) {
        const fakeRes = {
            getHeader: () => undefined,
            setHeader: () => undefined,
            on: () => undefined,
            once: () => undefined,
            emit: () => true,
            end: () => undefined
        };
        try {
            parser(req, fakeRes, next);
        }
        catch (err) {
            Logger.getLogger().error('WebSocketServer::sessionParser failed', err);
            next();
        }
    }
    _authorizeAndAccept(entry, req, socket, head) {
        const opts = entry.options;
        if (opts.sessionSchema) {
            const errors = [];
            if (!opts.sessionSchema.validate(req.session, errors)) {
                this._reject(socket, 401, 'Unauthorized');
                return;
            }
        }
        const finishHandshake = () => {
            this._wss.handleUpgrade(req, socket, head, (ws) => {
                this._onConnection(ws, req, entry);
            });
        };
        if (opts.aclRight) {
            const session = req.session;
            const role = session?.user?.role;
            if (!role) {
                this._reject(socket, 401, 'Unauthorized');
                return;
            }
            ACL.getInstance().checkAccess(role, opts.aclRight)
                .then((ok) => {
                if (ok) {
                    finishHandshake();
                }
                else {
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
    _onConnection(ws, req, entry) {
        const ctx = {
            ws: ws,
            request: req,
            session: req.session,
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
        ws.on('message', (data, isBinary) => {
            if (isBinary) {
                this._closeWith(ws, WebSocketCloseCode.INVALID_PAYLOAD, 'binary not supported');
                return;
            }
            const text = data.toString();
            this._dispatchMessage(ws, entry, ctx, text).catch((err) => {
                Logger.getLogger().error(`WebSocketServer::dispatchMessage error on '${entry.path}'`, err);
            });
        });
        ws.on('close', (code, reason) => {
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
    async _dispatchMessage(ws, entry, ctx, text) {
        let payload;
        try {
            payload = JSON.parse(text);
        }
        catch {
            this._closeWith(ws, WebSocketCloseCode.INVALID_PAYLOAD, 'invalid JSON');
            return;
        }
        if (entry.options.bodySchema) {
            const errors = [];
            if (!entry.options.bodySchema.validate(payload, errors)) {
                this._closeWith(ws, WebSocketCloseCode.INVALID_PAYLOAD, 'schema validation failed');
                return;
            }
        }
        try {
            await entry.endpoint.onMessage(ctx, payload);
        }
        catch (err) {
            Logger.getLogger().error(`WebSocketServer::onMessage error on '${entry.path}'`, err);
        }
    }
    _reject(socket, status, reason) {
        try {
            socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
        }
        catch {
        }
        socket.destroy();
    }
    _closeWith(ws, code, reason) {
        try {
            ws.close(code, reason);
        }
        catch {
            try {
                ws.terminate();
            }
            catch {
            }
        }
    }
}
//# sourceMappingURL=WebSocketServer.js.map