import {
    DefaultRouteCheckUserIsLoginACL,
    HttpRouteLoader,
    HttpRouteProviders,
    IDefaultRoute,
    ServiceRoute,
    SwaggerUIRoute
} from 'figtree';
import {Right} from '../ACL/MyACLRbac.js';
import {ExampleBackend} from '../Application/ExampleBackend.js';
import {Login} from './API/Login.js';

/**
 * Example route loader
 */
export class ExampleRouteLoader extends HttpRouteLoader {

    public static override async loadRoutes(): Promise<IDefaultRoute[]> {
        SwaggerUIRoute.getInstance().setInfo('Example', '1.0.1');

        const routeProviders = new HttpRouteProviders();

        return [
            new Login(),
            new ServiceRoute(ExampleBackend.NAME, DefaultRouteCheckUserIsLoginACL, {
                status: Right.service_status,
                start: Right.service_start,
                stop: Right.service_stop,
                invoke: Right.service_start
            }),
            SwaggerUIRoute.getInstance(),
            ...await routeProviders.getProvidersRoutes()
        ];
    }

}