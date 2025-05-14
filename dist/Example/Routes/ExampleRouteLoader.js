import { HttpRouteLoader } from '../../Server/HttpServer/HttpRouteLoader.js';
import { SwaggerUIRoute } from '../../Server/HttpServer/Routes/SwaggerUIRoute.js';
import { Login } from './API/Login.js';
export class ExampleRouteLoader extends HttpRouteLoader {
    static async loadRoutes() {
        SwaggerUIRoute.getInstance().setInfo('Example', '1.0.1');
        return [
            new Login(),
            SwaggerUIRoute.getInstance()
        ];
    }
}
//# sourceMappingURL=ExampleRouteLoader.js.map