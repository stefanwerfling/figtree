import { HttpRouteLoader } from '../../Server/HttpServer/HttpRouteLoader.js';
import { DefaultRoute } from '../../Server/HttpServer/Routes/DefaultRoute.js';
export declare class ExampleRouteLoader extends HttpRouteLoader {
    static loadRoutes(): Promise<DefaultRoute[]>;
}
