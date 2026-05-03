import {Vts} from 'vts';
import {
    WebSocketContext,
    WebSocketEndpoint,
    WebSocketEndpointOptions
} from 'figtree';

const SchemaEcho = Vts.object({
    msg: Vts.string()
});

type EchoMessage = { msg: string; };

/**
 * Demo WebSocket endpoint contributed by the plugin. Reachable at:
 *   ws://localhost:3000/ws/v1/plugin/echo
 *
 * Send `{"msg": "hello"}` and the server echoes back `{"echo": "hello"}`.
 */
export class EchoWebSocketEndpoint extends WebSocketEndpoint<EchoMessage> {

    public getPath(): string {
        return '/ws/v1/plugin/echo';
    }

    public getOptions(): WebSocketEndpointOptions<EchoMessage> {
        return {
            description: 'Echo every received message',
            bodySchema: SchemaEcho
        };
    }

    public override async onConnect(ctx: WebSocketContext): Promise<void> {
        ctx.ws.send(JSON.stringify({ welcome: 'connected', pid: process.pid }));
    }

    public override async onMessage(ctx: WebSocketContext, body: EchoMessage): Promise<void> {
        ctx.ws.send(JSON.stringify({ echo: body.msg }));
    }

}