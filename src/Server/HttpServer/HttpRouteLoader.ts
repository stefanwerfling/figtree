import {DefaultRoute} from './Routes/DefaultRoute.js';

export class HttpRouteLoader {

    /**
     * Load routes for HTTP Server
     * @return {DefaultRoute[]}
     */
    public static async loadRoutes(): Promise<DefaultRoute[]> {
        throw new Error('HttpRouteLoader::loadRoutes: please set your own class!');
    }

}

/**
 * DB Loader Type
 */
export type HttpRouteLoaderType = { new(): HttpRouteLoader;

    /**
     * Load routes for HTTP Server
     * @return {DefaultRoute[]}
     */
    loadRoutes(): Promise<DefaultRoute[]>;
};