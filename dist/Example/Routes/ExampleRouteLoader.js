import { HttpRouteLoader } from '../../Server/HttpServer/HttpRouteLoader.js';
import { ServiceRoute } from '../../Server/HttpServer/Routes/ServiceRoute.js';
import { SwaggerUIRoute } from '../../Server/HttpServer/Routes/SwaggerUIRoute.js';
import { ExampleBackend } from '../Application/ExampleBackend.js';
import { Login } from './API/Login.js';
export class ExampleRouteLoader extends HttpRouteLoader {
    static async loadRoutes() {
        SwaggerUIRoute.getInstance().setInfo('Example', '1.0.1');
        return [
            new Login(),
            new ServiceRoute(ExampleBackend.NAME, false),
            SwaggerUIRoute.getInstance()
        ];
    }
}
//# sourceMappingURL=ExampleRouteLoader.js.map