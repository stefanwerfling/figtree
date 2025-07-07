import { Router } from 'express';
import { SchemaHelper } from '../../../Utils/SchemaHelper.js';
import swaggerUi from 'swagger-ui-express';
export class SwaggerUIRoute {
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
            tags: description.tags !== undefined ? description.tags : undefined,
            requestBody: undefined,
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
        if (description.cookieSchema) {
            parameters.push(...SchemaHelper.convertSchemaToSwaggerParameter('cookie', description.cookieSchema));
        }
        if (parameters.length > 0) {
            spec.parameters = parameters;
        }
        if (description.bodySchema) {
            spec.requestBody = SchemaHelper.convertSchemaToSwaggerRequest(description.bodySchema);
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
        const routes = Router();
        routes.use('/swagger', swaggerUi.serve);
        routes.get('/swagger', (req, res, next) => {
            const handler = swaggerUi.setup(this._openApiSpec);
            handler(req, res, next);
        });
        return routes;
    }
}
//# sourceMappingURL=SwaggerUIRoute.js.map