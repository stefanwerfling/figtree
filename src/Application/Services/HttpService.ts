import {ConfigBackendOptions, SchemaConfigHttpServer, ServiceImportance, ServiceStatus} from 'figtree-schemas';
import {v4 as uuid} from 'uuid';
import {Config} from '../../Config/Config.js';
import {Logger} from '../../Logger/Logger.js';
import {BaseHttpServerOptionCsrf, BaseHttpServerOptionProxy} from '../../Server/HttpServer/BaseHttpServer.js';
import {HttpRouteLoaderType} from '../../Server/HttpServer/HttpRouteLoader.js';
import {HttpServer} from '../../Server/HttpServer/HttpServer.js';
import {WebSocketEndpointLoaderType} from '../../Server/HttpServer/WebSocket/WebSocketEndpointLoader.js';
import {WebSocketServer, WebSocketServerOptions} from '../../Server/HttpServer/WebSocket/WebSocketServer.js';
import {ServiceAbstract} from '../../Service/ServiceAbstract.js';
import {ServiceError} from '../../Service/ServiceError.js';
import {StringHelper} from '../../Utils/StringHelper.js';

/**
 * Optional WebSocket configuration for `HttpService`.
 */
export type HttpServiceWebSocketOptions = {
    /** Loader supplying the application's WebSocket endpoints. */
    loader: WebSocketEndpointLoaderType;
    /** Server-level options (heartbeat, payload limits). */
    server?: WebSocketServerOptions;
};

/**
 * Http Service
 */
export class HttpService extends ServiceAbstract {

    /**
     * Name of Http Server service
     */
    public static NAME = 'httpserver';

    /**
     * Importance
     */
    protected readonly _importance: ServiceImportance = ServiceImportance.Important;

    /**
     * Loader
     * @protected
     */
    protected _loader: HttpRouteLoaderType;

    /**
     * Optional WebSocket configuration. When set, an attached
     * `WebSocketServer` shares the underlying `http.Server`.
     * @protected
     */
    protected _wsOptions?: HttpServiceWebSocketOptions;

    /**
     * Http Server
     * @protected
     */
    protected _server: HttpServer|null = null;

    /**
     * WebSocket server (only when `wsOptions` was passed to the constructor).
     * @protected
     */
    protected _wsServer: WebSocketServer|null = null;

    /**
     * Constructor
     * @param {HttpRouteLoaderType} loader
     * @param {[string]} serviceName
     * @param {[string[]]} serviceDependencies
     * @param {HttpServiceWebSocketOptions} [wsOptions]
     */
    public constructor(
        loader: HttpRouteLoaderType,
        serviceName?: string,
        serviceDependencies?: string[],
        wsOptions?: HttpServiceWebSocketOptions
    ) {
        super(serviceName ?? HttpService.NAME, serviceDependencies);
        this._loader = loader;
        this._wsOptions = wsOptions;
    }

    /**
     * Return the server
     */
    public getServer(): HttpServer|null {
        return this._server;
    }

    /**
     * Return the WebSocket server, if configured.
     */
    public getWebSocketServer(): WebSocketServer|null {
        return this._wsServer;
    }

    /**
     * Start the service
     */
    public override async start(): Promise<void> {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;

        try {
            const tConfig = Config.getInstance().get() as ConfigBackendOptions;

            if (tConfig === null) {
                throw new ServiceError(
                    this.constructor.name,
                    'Config is null. Check your config file exists!'
                );
            }

            if (tConfig.httpserver && !SchemaConfigHttpServer.validate(tConfig.httpserver, [])) {
                throw new ServiceError(
                    this.constructor.name,
                    'Configuration is invalid. Check your config file format and values.'
                );
            }

            let aport = 3000;
            let public_dir = '';
            let ssl_path = '';
            let session_secret = uuid();
            let session_cookie_path = '/';
            let session_cookie_max_age = 6000000;

            if (tConfig.httpserver) {
                if (tConfig.httpserver.port) {
                    aport = tConfig.httpserver.port;
                }

                if (tConfig.httpserver.publicdir) {
                    public_dir = tConfig.httpserver.publicdir;
                }

                if (tConfig.httpserver.session) {
                    if (tConfig.httpserver.session.secret) {
                        session_secret = tConfig.httpserver.session.secret;
                    }

                    if (tConfig.httpserver.session.cookie_path) {
                        session_cookie_path = tConfig.httpserver.session.cookie_path;
                    }

                    if (tConfig.httpserver.session.cookie_max_age) {
                        session_cookie_max_age = tConfig.httpserver.session.cookie_max_age;
                    }
                }

                if (tConfig.httpserver.sslpath) {
                    ssl_path = tConfig.httpserver.sslpath;
                }
            }

            let proxy: BaseHttpServerOptionProxy|undefined;

            if (tConfig.httpserver.proxy) {
                proxy = {
                    trust: tConfig.httpserver.proxy.trust
                };
            }

            let csrf: BaseHttpServerOptionCsrf|undefined;

            if (tConfig.httpserver.csrf) {
                csrf = {
                    cookie: tConfig.httpserver.csrf.cookie
                };
            }

            this._server = new HttpServer({
                realm: Config.getInstance().getAppTitle(),
                port: aport,
                session: {
                    secret: session_secret,
                    cookie_path: session_cookie_path,
                    ssl_path: ssl_path,
                    max_age: session_cookie_max_age
                },
                routes: await this._loader.loadRoutes(),
                publicDir: public_dir,
                crypt: {
                    sslPath: ssl_path,
                    key: 'server.pem',
                    crt: 'server.crt'
                },
                proxy: proxy,
                csrf: csrf
            });

            await this._server.setupAndListen();

            if (this._wsOptions) {
                this._wsServer = new WebSocketServer(this._server, this._wsOptions.server);

                const endpoints = await this._wsOptions.loader.loadEndpoints();

                for (const endpoint of endpoints) {
                    this._wsServer.addEndpoint(endpoint);
                }

                this._wsServer.start();
            }
        } catch(error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;

            this._statusMsg = StringHelper.sprintf(
                'HttpService::start: Error while create the HTTPServer: %e',
                error
            );

            Logger.getLogger().error(this._statusMsg);

            throw error;
        }

        this._statusMsg = '';
        this._status = ServiceStatus.Success;
        this._inProcess = false;
    }

    /**
     * Stop the service
     */
    public override async stop(): Promise<void> {
        try {
            if (this._wsServer) {
                await this._wsServer.stop();
                this._wsServer = null;
            }

            if (this._server) {
                this._server.close();
            }
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('HttpService::stop: Error stopping the HTTPServer: %e', error);

            Logger.getLogger().error(this._statusMsg);
        } finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }

}