import {APlugin} from 'figtree';
import {MyHttpMiddlewareProvider} from './MyHttpMiddlewareProvider.js';
import {MyHttpRouteProvider} from './MyHttpRouteProvider.js';
import {MyLifecycleEvent} from './MyLifecycleEvent.js';
import {MyWebSocketEndpointProvider} from './MyWebSocketEndpointProvider.js';

/**
 * MyPlugin — entry point loaded by `PluginManager` after the host has scanned
 * its `node_modules` and found this package's `package.json[figtree]` block.
 *
 * The plugin registers four event objects with the manager:
 *
 * - `MyHttpRouteProvider` — adds a GET /json/v1/plugin/hello route via the
 *   host's `HttpRouteProviders`.
 * - `MyHttpMiddlewareProvider` — installs a `X-Request-Id` middleware
 *   automatically picked up by `BaseHttpServer._initExpressUsePlugins()`.
 * - `MyWebSocketEndpointProvider` — adds an /ws/v1/plugin/echo WebSocket
 *   endpoint via `WebSocketEndpointProviders`.
 * - `MyLifecycleEvent` — receives `onStart` / `onStop` callbacks around the
 *   `ServiceManager` lifecycle.
 */
export default class MyPlugin extends APlugin {

    public getName(): string {
        return 'my-plugin';
    }

    public async onEnable(): Promise<boolean> {
        const manager = this.getPluginManager();

        manager.registerEvents(new MyHttpRouteProvider(),         this);
        manager.registerEvents(new MyHttpMiddlewareProvider(),    this);
        manager.registerEvents(new MyWebSocketEndpointProvider(), this);
        manager.registerEvents(new MyLifecycleEvent(),            this);

        return true;
    }

    public async onDisable(): Promise<boolean> {
        return true;
    }

}