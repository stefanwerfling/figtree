import {HttpRouteLoader} from '../../Server/HttpServer/HttpRouteLoader.js';
import {DefaultRoute} from '../../Server/HttpServer/Routes/DefaultRoute.js';
import {SwaggerUIRoute} from '../../Server/HttpServer/Routes/SwaggerUIRoute.js';
import {Login} from './API/Login.js';

export class ExampleRouteLoader extends HttpRouteLoader {

    /**
     * Load routes for HTTP Server
     * @return {DefaultRoute[]}
     */
    public static async loadRoutes(): Promise<DefaultRoute[]> {
        SwaggerUIRoute.getInstance().setInfo('Example', '1.0.1');

        return [
            new Login(),
            SwaggerUIRoute.getInstance()
        ];
    }
}