import { DefaultRoute } from './DefaultRoute.js';
import swaggerUi from 'swagger-ui-express';
export class SwaggerUIRoute extends DefaultRoute {
    _openApiSpec = {
        openapi: '3.0.0',
        info: {
            title: '',
            version: ''
        },
        paths: {}
    };
    constructor(title = 'Dynamische API', version = '1.0.0') {
        super();
        this._openApiSpec.info.title = title;
        this._openApiSpec.info.version = version;
    }
    getExpressRouter() {
        this._routes.use('/swagger', (req, res, next) => {
            swaggerUi.setup(this._openApiSpec)(req, res, next);
        });
        this._routes.use('/swagger', swaggerUi.serve);
        return super.getExpressRouter();
    }
}
//# sourceMappingURL=SwaggerUIRoute.js.map