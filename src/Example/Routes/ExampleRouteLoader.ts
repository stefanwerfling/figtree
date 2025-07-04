import {HttpRouteLoader} from '../../Server/HttpServer/HttpRouteLoader.js';
import {HttpRouteProviders} from '../../Server/HttpServer/HttpRouteProviders.js';
import {DefaultRouteCheckUserIsLoginACL} from '../../Server/HttpServer/Routes/DefaultRouteCheckUser.js';
import {IDefaultRoute} from '../../Server/HttpServer/Routes/IDefaultRoute.js';
import {ServiceRoute} from '../../Server/HttpServer/Routes/ServiceRoute.js';
import {SwaggerUIRoute} from '../../Server/HttpServer/Routes/SwaggerUIRoute.js';
import {Right} from '../ACL/MyACLRbac.js';
import {ExampleBackend} from '../Application/ExampleBackend.js';
import {Login} from './API/Login.js';

/**
 * Example route loader
 */
export class ExampleRouteLoader extends HttpRouteLoader {

    /**
     * Load routes for HTTP Server
     * @return {DefaultRoute[]}
     */
    public static async loadRoutes(): Promise<IDefaultRoute[]> {
        SwaggerUIRoute.getInstance().setInfo('Example', '1.0.1');

        const routeProviders = new HttpRouteProviders();

        return [
            new Login(),
            new ServiceRoute(ExampleBackend.NAME, DefaultRouteCheckUserIsLoginACL, {
                status: Right.service_status,
                start: Right.service_start,
                stop: Right.service_stop
            }),
            SwaggerUIRoute.getInstance(),
            ...await routeProviders.getProvidersRoutes()
        ];
    }
}