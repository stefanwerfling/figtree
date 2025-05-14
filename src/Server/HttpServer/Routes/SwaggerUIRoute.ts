import {Router} from 'express';
import {Schema, Vts} from 'vts';
import {ObjectSchemaItems} from 'vts/src/schemas/objectSchema.js';
import {DefaultRoute, DefaultRouteMethodeDescription} from './DefaultRoute.js';
import swaggerUi from 'swagger-ui-express';

export type SwaggerUIRouteDescription = {
    description: string;
    requestBodySchema: ObjectSchemaItems
};

/**
 * Swagger UI Route
 */
export class SwaggerUIRoute extends DefaultRoute {

    /**
     * Instance
     * @protected
     */
    protected static _instance: SwaggerUIRoute|null = null;

    /**
     * Return the instance from swagger ui route
     * @return {SwaggerUIRoute}
     */
    public static getInstance(): SwaggerUIRoute {
        if (SwaggerUIRoute._instance === null) {
            SwaggerUIRoute._instance = new SwaggerUIRoute()
        }

        return SwaggerUIRoute._instance;
    }

    /**
     * Has an instance
     * @return {boolean}
     */
    public static hasInstance(): boolean {
        return SwaggerUIRoute._instance !== null;
    }

    /**
     * open api spec
     * @protected
     */
    protected _openApiSpec: any = {
        openapi: '3.0.0',
        info: {
            title: '',
            version: ''
        },
        paths: {}
    };

    /**
     * Set info for API
     * @param {string} title
     * @param {string} version
     */
    public setInfo(title: string = 'Dynamische API', version: string = '1.0.0'): void {
        this._openApiSpec.info.title = title;
        this._openApiSpec.info.version = version;
    }

    protected _convertToOpenApiResponse(obj: any, statusCode: string = '200'): any {
        if (typeof obj !== 'object' || obj === null) {
            throw new Error('Input schema must be a non-null object');
        }

        const { description, type, items } = obj;

        if (type !== 'object' || typeof items !== 'object') {
            throw new Error('Schema must be of type "object" with an "items" field');
        }

        const properties: Record<string, any> = {};
        const required: string[] = [];

        for (const [key, value] of Object.entries(items)) {
            if (value === null || typeof value !== 'object' || !('type' in value) || !('description' in value)) {
                throw new Error(`Invalid item definition for key "${key}"`);
            }

            const prop: any = {
                description: value.description
            };

            if (value.type === 'or') {
                const orValue = value as {
                    values: (string | number)[];
                    description: string;
                    type: 'or';
                    optional?: boolean
                };

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

        const schema: any = {
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

    public registerPost<T>(url: string, description: DefaultRouteMethodeDescription<T>): void {
        this._addRouteToSwagger(url, 'post', {
            summary: description.description,
            requestBody: {
                required: true,
                content: {
                    'application/json': {

                    }
                }
            }
        });
    }

    public registerGet<T>(url: string, description: DefaultRouteMethodeDescription<T>): void {
        const spec = {
            summary: description.description,
            responses: undefined
        };

        if (description.responseBodySchema) {
            spec.responses = this._convertToOpenApiResponse(description.responseBodySchema.describe());
        }

        this._addRouteToSwagger(url, 'get', spec);
    }

    protected _addRouteToSwagger(path: string, method: string, spec: any) {
        this._openApiSpec.paths[path] = this._openApiSpec.paths[path] || {};
        this._openApiSpec.paths[path][method] = spec;
    }

    /**
     * Return the express router
     * @returns {Router}
     */
    public getExpressRouter(): Router {
        this._routes.use('/swagger', swaggerUi.serve);

        this._routes.get('/swagger', (req, res, next) => {
            const handler = swaggerUi.setup(this._openApiSpec);
            handler(req, res, next); // gibt HTML zurück
        });

        return super.getExpressRouter();
    }
}