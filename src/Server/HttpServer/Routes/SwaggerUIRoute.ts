import {Router} from 'express';
import {SchemaHelper} from '../../../Utils/SchemaHelper.js';
import {DefaultRouteMethodeDescription} from './DefaultRoute.js';
import {IDefaultRoute} from './IDefaultRoute.js';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger UI Route
 */
export class SwaggerUIRoute implements IDefaultRoute {

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

    /**
     * Add route to swagger
     * @param {string} url
     * @param {string} method
     * @param {DefaultRouteMethodeDescription} description
     * @protected
     */
    protected _addRouteToSwagger<A, B, C, D, E, F, G, S>(url: string, method: string, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>) {
        let swagUrl = url;
        const spec = {
            summary: description.description,
            requestBody: undefined as undefined | object,
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

        // add path with spec
        this._openApiSpec.paths[swagUrl] = this._openApiSpec.paths[swagUrl] || {};
        this._openApiSpec.paths[swagUrl][method] = spec;
    }

    /**
     * Register post
     * @param {string} url
     * @param {DefaultRouteMethodeDescription} description
     */
    public registerPost<A, B, C, D, E, F, G, S>(url: string, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void {
        this._addRouteToSwagger(url, 'post', description);
    }

    /**
     * Register get
     * @param {string} url
     * @param {DefaultRouteMethodeDescription} description
     */
    public registerGet<A, B, C, D, E, F, G, S>(url: string, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void {
        this._addRouteToSwagger(url, 'get', description);
    }

    /**
     * Return the express router
     * @returns {Router}
     */
    public getExpressRouter(): Router {
        const routes = Router();

        routes.use('/swagger', swaggerUi.serve);
        routes.get('/swagger', (req, res, next) => {
            const handler = swaggerUi.setup(this._openApiSpec);
            handler(req, res, next); // gibt HTML zurück
        });

        return routes;
    }
}