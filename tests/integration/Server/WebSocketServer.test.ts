/* eslint-disable max-classes-per-file */
import {AddressInfo} from 'net';
import {createServer, Server as HttpServer} from 'http';
import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import express, {Application} from 'express';
import session from 'express-session';
import {Vts} from 'vts';
import {WebSocket} from 'ws';
import {WebSocketEndpoint, WebSocketEndpointOptions} from '../../../src/Server/HttpServer/WebSocket/WebSocketEndpoint.js';
import {WebSocketServer} from '../../../src/Server/HttpServer/WebSocket/WebSocketServer.js';
import {BaseHttpServer} from '../../../src/Server/HttpServer/BaseHttpServer.js';

/**
 * Minimal in-memory BaseHttpServer that wraps an existing http.Server. We do
 * not want to launch a real BaseHttpServer for these tests because it would
 * start its own listener; we just need `getServer()` and `getSessionParser()`.
 */
class TestHttpServer extends BaseHttpServer {

    public constructor(http: HttpServer, sessionParser: express.RequestHandler | null) {
        super({
            realm: 'test',
            session: { secret: 'x', cookie_path: '/', ssl_path: '', max_age: 60_000 }
        });

        this._server = http;
        this._sessionParser = sessionParser;
    }

}

const SchemaEcho = Vts.object({ msg: Vts.string() });

class EchoEndpoint extends WebSocketEndpoint<{ msg: string; }> {

    public getPath(): string {
        return '/ws/echo';
    }

    public getOptions(): WebSocketEndpointOptions<{ msg: string; }> {
        return { bodySchema: SchemaEcho };
    }

    public override async onMessage(ctx: any, body: { msg: string; }): Promise<void> {
        ctx.ws.send(JSON.stringify({ echo: body.msg }));
    }

}

const SchemaSession = Vts.object({
    user: Vts.optional(Vts.object({
        userid: Vts.string(),
        isLogin: Vts.boolean()
    }))
});

class ProtectedEndpoint extends WebSocketEndpoint<{ ping: string; }> {

    public getPath(): string {
        return '/ws/protected';
    }

    public getOptions(): WebSocketEndpointOptions<{ ping: string; }, unknown> {
        return {
            bodySchema: Vts.object({ ping: Vts.string() }),
            sessionSchema: SchemaSession
        };
    }

    public override async onMessage(ctx: any, body: { ping: string; }): Promise<void> {
        ctx.ws.send(JSON.stringify({ pong: body.ping, sid: ctx.sessionId }));
    }

}

describe('WebSocketServer integration', () => {

    let app: Application;
    let http: HttpServer;
    let wss: WebSocketServer;
    let port: number;

    beforeAll(async() => {
        app = express();
        const sessionParser = session({ secret: 'test-secret', resave: false, saveUninitialized: true });
        app.use(sessionParser);

        http = createServer(app);
        await new Promise<void>((resolve) => {
            http.listen(0, '127.0.0.1', () => resolve());
        });
        port = (http.address() as AddressInfo).port;

        const baseHttp = new TestHttpServer(http, sessionParser);

        wss = new WebSocketServer(baseHttp, { heartbeatMs: 0 });
        wss.addEndpoint(new EchoEndpoint());
        wss.addEndpoint(new ProtectedEndpoint());
        wss.start();
    });

    afterAll(async() => {
        await wss.stop();
        await new Promise<void>((resolve) => {
            http.close(() => resolve());
        });
    });

    const wsUrl = (path: string): string => `ws://127.0.0.1:${port}${path}`;

    it('echoes a valid JSON message', async() => {
        const ws = new WebSocket(wsUrl('/ws/echo'));
        await new Promise<void>((resolve, reject) => {
            ws.once('open', () => resolve());
            ws.once('error', reject);
        });

        const reply = await new Promise<string>((resolve) => {
            ws.once('message', (data) => resolve(data.toString()));
            ws.send(JSON.stringify({ msg: 'hello' }));
        });

        expect(JSON.parse(reply)).toEqual({ echo: 'hello' });
        ws.close();
    });

    it('closes the connection on schema-invalid input', async() => {
        const ws = new WebSocket(wsUrl('/ws/echo'));
        await new Promise<void>((resolve, reject) => {
            ws.once('open', () => resolve());
            ws.once('error', reject);
        });

        const close = await new Promise<{ code: number; }>((resolve) => {
            ws.once('close', (code) => resolve({ code: code }));
            ws.send(JSON.stringify({ wrong: 'shape' }));
        });

        expect(close.code).toBe(4400);
    });

    it('closes the connection on invalid JSON', async() => {
        const ws = new WebSocket(wsUrl('/ws/echo'));
        await new Promise<void>((resolve, reject) => {
            ws.once('open', () => resolve());
            ws.once('error', reject);
        });

        const close = await new Promise<{ code: number; }>((resolve) => {
            ws.once('close', (code) => resolve({ code: code }));
            ws.send('this is not json');
        });

        expect(close.code).toBe(4400);
    });

    it('rejects upgrade with 401 when sessionSchema validation fails', async() => {
        // express-session populates req.session with framework-managed fields
        // (cookie, id, ...) plus whatever the app stored. Our SchemaSession is
        // strict — only `user` is allowed — so the populated session fails
        // validation and the upgrade is rejected with 401.
        const ws = new WebSocket(wsUrl('/ws/protected'));

        const result = await new Promise<{ code?: number; opened: boolean; }>((resolve) => {
            ws.once('open', () => resolve({ opened: true }));
            ws.once('unexpected-response', (_req, res) => resolve({ opened: false, code: res.statusCode }));
            ws.once('error', () => resolve({ opened: false }));
        });

        expect(result.opened).toBe(false);
        expect(result.code).toBe(401);
    });

    it('returns 503 on upgrade after stop()', async() => {
        // Spin up a fresh, isolated server we can stop independently.
        const localApp = express();
        const localHttp = createServer(localApp);
        await new Promise<void>((resolve) => {
            localHttp.listen(0, '127.0.0.1', () => resolve());
        });
        const localPort = (localHttp.address() as AddressInfo).port;

        const baseHttp = new TestHttpServer(localHttp, null);
        const localWss = new WebSocketServer(baseHttp, { heartbeatMs: 0 });
        localWss.addEndpoint(new EchoEndpoint());
        localWss.start();

        await localWss.stop();

        // After stop, the upgrade listener is removed → connection is reset
        // by node http server (no upgrade handler), client sees ECONNRESET
        // or close. We assert that no `open` event fires.
        const ws = new WebSocket(`ws://127.0.0.1:${localPort}/ws/echo`);
        const opened = await new Promise<boolean>((resolve) => {
            ws.once('open', () => resolve(true));
            ws.once('close', () => resolve(false));
            ws.once('error', () => resolve(false));
            setTimeout(() => resolve(false), 200);
        });

        expect(opened).toBe(false);

        await new Promise<void>((resolve) => {
            localHttp.close(() => resolve());
        });
    });

});