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
    _convertToOpenApiResponse(obj, statusCode = '200') {
        if (typeof obj !== 'object' || obj === null) {
            throw new Error('Input schema must be a non-null object');
        }
        const { description, type, items } = obj;
        if (type !== 'object' || typeof items !== 'object') {
            throw new Error('Schema must be of type "object" with an "items" field');
        }
        const properties = {};
        const required = [];
        for (const [key, value] of Object.entries(items)) {
            if (value === null || typeof value !== 'object' || !('type' in value) || !('description' in value)) {
                throw new Error(`Invalid item definition for key "${key}"`);
            }
            const prop = {
                description: value.description
            };
            if (value.type === 'or') {
                const orValue = value;
                if (!Array.isArray(orValue.values)) {
                    throw new Error(`"or" type must have a "values" array for key "${key}"`);
                }
                prop.enum = orValue.values;
                prop.type = typeof orValue.values[0] === 'number' ? 'integer' : 'string';
            }
            if (!('optional' in value) || !value.optional) {
                required.push(key);
            }
            properties[key] = prop;
        }
        const schema = {
            type: 'object',
            properties
        };
        if (required.length > 0) {
            schema.required = required;
        }
        return {
            [statusCode]: {
                description: description || '',
                content: {
                    'application/json': {
                        schema
                    }
                }
            }
        };
    }
    registerPost(url, description) {
        this._addRouteToSwagger(url, 'post', {
            summary: description.description,
            requestBody: {
                required: true,
                content: {
                    'application/json': {}
                }
            }
        });
    }
    registerGet(url, description) {
        const spec = {
            summary: description.description,
            responses: undefined
        };
        if (description.responseBodySchema) {
            spec.responses = this._convertToOpenApiResponse(description.responseBodySchema.describe());
        }
        this._addRouteToSwagger(url, 'get', spec);
    }
    _addRouteToSwagger(path, method, spec) {
        this._openApiSpec.paths[path] = this._openApiSpec.paths[path] || {};
        this._openApiSpec.paths[path][method] = spec;
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