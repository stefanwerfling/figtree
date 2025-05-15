import { HttpRouteLoader } from '../../Server/HttpServer/HttpRouteLoader.js';
import { IDefaultRoute } from '../../Server/HttpServer/Routes/IDefaultRoute.js';
export declare class ExampleRouteLoader extends HttpRouteLoader {
    static loadRoutes(): Promise<IDefaultRoute[]>;
}
