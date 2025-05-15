import {Router} from 'express';
import {SchemaHelper} from '../../../Utils/SchemaHelper.js';
import {DefaultRoute, DefaultRouteMethodeDescription} from './DefaultRoute.js';
import swaggerUi from 'swagger-ui-express';

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

    protected _addRouteToSwagger<T>(url: string, method: string, description: DefaultRouteMethodeDescription<T>) {
        let swagUrl = url;
        const spec = {
            summary: description.description,
            responses: undefined as undefined | object,
            parameters: undefined as undefined | object[]
        };

        const parameters: object[] = [];

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

        // add path with spec
        this._openApiSpec.paths[swagUrl] = this._openApiSpec.paths[swagUrl] || {};
        this._openApiSpec.paths[swagUrl][method] = spec;
    }

    public registerPost<T>(url: string, description: DefaultRouteMethodeDescription<T>): void {
        this._addRouteToSwagger(url, 'post', description);
        /*this._addRouteToSwagger(url, 'post', {
            summary: description.description,
            requestBody: {
                required: true,
                content: {
                    'application/json': {

                    }
                }
            }
        });*/
    }

    public registerGet<T>(url: string, description: DefaultRouteMethodeDescription<T>): void {
        this._addRouteToSwagger(url, 'get', description);
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