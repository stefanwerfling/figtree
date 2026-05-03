import {HttpRouteLoader, IDefaultRoute} from 'figtree';
import {HelloRoute} from './HelloRoute.js';

/**
 * RouteLoader for the plugin — returns the routes the plugin contributes.
 */
export class HelloRouteLoader extends HttpRouteLoader {

    public static override async loadRoutes(): Promise<IDefaultRoute[]> {
        return [new HelloRoute()];
    }

}