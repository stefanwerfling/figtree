import {IDefaultRoute} from './Routes/IDefaultRoute.js';

export class HttpRouteLoader {

    /**
     * Load routes for HTTP Server
     * @return {DefaultRoute[]}
     */
    public static async loadRoutes(): Promise<IDefaultRoute[]> {
        throw new Error('HttpRouteLoader::loadRoutes: please set your own class!');
    }

}

/**
 * Http Route Loader Type
 */
export type HttpRouteLoaderType = { new(): HttpRouteLoader;

    /**
     * Load routes for HTTP Server
     * @return {IDefaultRoute[]}
     */
    loadRoutes(): Promise<IDefaultRoute[]>;

};