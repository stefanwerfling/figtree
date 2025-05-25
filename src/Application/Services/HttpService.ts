import {v4 as uuid} from 'uuid';
import {Config} from '../../Config/Config.js';
import {Logger} from '../../Logger/Logger.js';
import {SchemaConfigBackendOptions} from '../../Schemas/Config/ConfigBackendOptions.js';
import {BaseHttpServerOptionProxy} from '../../Server/HttpServer/BaseHttpServer.js';
import {HttpRouteLoaderType} from '../../Server/HttpServer/HttpRouteLoader.js';
import {HttpServer} from '../../Server/HttpServer/HttpServer.js';
import {ServiceAbstract, ServiceImportance, ServiceStatus} from '../../Service/ServiceAbstract.js';
import {ServiceError} from '../../Service/ServiceError.js';
import {StringHelper} from '../../Utils/StringHelper.js';

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
     * Http Server
     * @protected
     */
    protected _server: HttpServer|null = null;

    /**
     * Constructor
     * @param {HttpRouteLoaderType} loader
     * @param {[string]} serviceName
     * @param {[string[]]} serviceDependencies
     */
    public constructor(loader: HttpRouteLoaderType, serviceName?: string, serviceDependencies?: string[]) {
        super(serviceName ?? HttpService.NAME, serviceDependencies);
        this._loader = loader;
    }

    /**
     * Start the service
     */
    public override async start(): Promise<void> {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;

        try {
            const tConfig = Config.getInstance().get();

            if (tConfig === null) {
                throw new ServiceError(
                    this.constructor.name,
                    'Config is null. Check your config file exists!'
                );
            }

            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
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

            let proxy: BaseHttpServerOptionProxy| undefined = undefined;

            if (tConfig.httpserver.proxy) {
                proxy = {
                    trust: tConfig.httpserver.proxy.trust
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
                proxy: proxy
            });

            await this._server.listen();
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
     * @param {boolean} forced
     */
    public override async stop(forced: boolean = false): Promise<void> {
        try {
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