import { SchemaHelper } from '../../../Utils/SchemaHelper.js';
import { DefaultRoute } from './DefaultRoute.js';
import swaggerUi from 'swagger-ui-express';
export class SwaggerUIRoute extends DefaultRoute {
    static _instance = null;
    static getInstance() {
        if (SwaggerUIRoute._instance === null) {
            SwaggerUIRoute._instance = new SwaggerUIRoute();
        }
        return SwaggerUIRoute._instance;
    }
    static hasInstance() {
        return SwaggerUIRoute._instance !== null;
    }
    _openApiSpec = {
        openapi: '3.0.0',
        info: {
            title: '',
            version: ''
        },
        paths: {}
    };
    setInfo(title = 'Dynamische API', version = '1.0.0') {
        this._openApiSpec.info.title = title;
        this._openApiSpec.info.version = version;
    }
    _addRouteToSwagger(url, method, description) {
        let swagUrl = url;
        const spec = {
            summary: description.description,
            responses: undefined,
            parameters: undefined
        };
        const parameters = [];
        if (description.querySchema) {
            parameters.push(...SchemaHelper.convertSchemaToSwaggerParameter('query', description.querySchema));
        }
        if (description.pathSchema) {
            const pathParameters = SchemaHelper.convertSchemaToSwaggerParameter('path', description.pathSchema);
            for (const param of pathParameters) {
                swagUrl = swagUrl.replace(`:${param.name}`, `{${param.name}}`);
            }
            parameters.push(...pathParameters);
        }
        if (description.headerSchema) {
            parameters.push(...SchemaHelper.convertSchemaToSwaggerParameter('header', description.headerSchema));
        }
        if (parameters.length > 0) {
            spec.parameters = parameters;
        }
        if (description.responseBodySchema) {
            spec.responses = SchemaHelper.convertSchemaToSwaggerResponse('200', description.responseBodySchema);
        }
        this._openApiSpec.paths[swagUrl] = this._openApiSpec.paths[swagUrl] || {};
        this._openApiSpec.paths[swagUrl][method] = spec;
    }
    registerPost(url, description) {
        this._addRouteToSwagger(url, 'post', description);
    }
    registerGet(url, description) {
        this._addRouteToSwagger(url, 'get', description);
    }
    getExpressRouter() {
        this._routes.use('/swagger', swaggerUi.serve);
        this._routes.get('/swagger', (req, res, next) => {
            const handler = swaggerUi.setup(this._openApiSpec);
            handler(req, res, next);
        });
        return super.getExpressRouter();
    }
}
//# sourceMappingURL=SwaggerUIRoute.js.map