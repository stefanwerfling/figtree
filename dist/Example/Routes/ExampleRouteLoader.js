import { HttpRouteLoader } from '../../Server/HttpServer/HttpRouteLoader.js';
import { HttpRouteProviders } from '../../Server/HttpServer/HttpRouteProviders.js';
import { ServiceRoute } from '../../Server/HttpServer/Routes/ServiceRoute.js';
import { SwaggerUIRoute } from '../../Server/HttpServer/Routes/SwaggerUIRoute.js';
import { ExampleBackend } from '../Application/ExampleBackend.js';
import { Login } from './API/Login.js';
export class ExampleRouteLoader extends HttpRouteLoader {
    static async loadRoutes() {
        SwaggerUIRoute.getInstance().setInfo('Example', '1.0.1');
        const routeProviders = new HttpRouteProviders();
        return [
            new Login(),
            new ServiceRoute(ExampleBackend.NAME, false),
            SwaggerUIRoute.getInstance(),
            ...await routeProviders.getProvidersRoutes()
        ];
    }
}
//# sourceMappingURL=ExampleRouteLoader.js.map