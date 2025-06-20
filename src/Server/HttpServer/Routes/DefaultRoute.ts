import {Request, RequestHandler, Response, Router} from 'express';
import {Logger} from '../../../Logger/Logger.js';
import {StatusCodes} from '../../../Schemas/Server/Routes/StatusCodes.js';
import {DefaultReturn} from './../../../Schemas/Server/Routes/DefaultReturn.js';
import path from 'path';
import {Schema, SchemaErrors} from 'vts';
import {DefaultRouteCheckUserIsLogin, DefaultRouteCheckUserLogin} from './DefaultRouteCheckUser.js';
import {IDefaultRoute} from './IDefaultRoute.js';
import {RequestContext} from './RequestContext.js';
import {RouteError} from './RouteError.js';
import {SwaggerUIRoute} from './SwaggerUIRoute.js';

/**
 * DefaultRouteHandler
 */
export type DefaultRouteHandler<A, B, C, D, E, F, S> = (
    request: Request,
    response: Response,
    data: {
        headers: A|undefined
        params: C|undefined,
        query: B|undefined,
        cookies: D|undefined,
        session: S|undefined,
        body: E|undefined
    }
) => Promise<F>;

/**
 * DefaultRouteMethodeDescription
 */
export type DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S> = {
    description?: string;
    tags?: string[];
    headerSchema?: Schema<A>;
    querySchema?: Schema<B>;
    pathSchema?: Schema<C>;
    cookieSchema?: Schema<D>;
    bodySchema?: Schema<E>;
    responseBodySchema?: Schema<F>;
    responseHeaderSchema?: Schema<G>;
    sessionSchema?: Schema<S>;
    parser?: RequestHandler,
    useLocalStorage?: boolean;
};



/**
 * DefaultRoute
 */
export class DefaultRoute implements IDefaultRoute {

    /**
     * routes
     * @protected
     */
    protected _routes: Router;

    /**
     * uri base
     * @protected
     */
    protected _uriBase: string = '/json/';

    /**
     * constructor
     */
    public constructor() {
        this._routes = Router();
    }

    /**
     * Return the uri for controller
     * @param {string} version
     * @param {string} base
     * @param {string} controller
     * @protected
     */
    protected _getUrl(version: string, base: string, controller: string): string {
        return path.join(this._uriBase, version, base, controller);
    }

    /**
     * Is Schema Validate
     * @param {Schema<T>} schema
     * @param {unknown} data
     * @param {Response} res
     * @param {boolean} autoSend
     * @template T
     * @return {T}
     */
    public isSchemaValidate<T>(
        schema: Schema<T>,
        data: unknown,
        res: Response,
        autoSend: boolean = true
    ): data is T {
        const errors: SchemaErrors = [];

        if (!schema.validate(data, errors)) {
            if (autoSend) {
                res.status(200).json({
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: JSON.stringify(errors, null, 2)
                } as DefaultReturn);
            }

            return false;
        }

        return true;
    }

    /**
     * Het Express Router
     * @return {Router}
     */
    public getExpressRouter(): Router {
        return this._routes;
    }

    /**
     * Alias for get registration
     * @param {string|string[]} uriPath
     * @param {boolean|DefaultRouteCheckUserLogin} checkUserLogin
     * @param {DefaultRouteHandlerPost} handler
     * @param {DefaultRouteMethodeDescription} description
     * @protected
     */
    protected _get<A, B, C, D, E, F, G, S>(
        uriPath: string|string[],
        checkUserLogin: boolean|DefaultRouteCheckUserLogin,
        handler: DefaultRouteHandler<A, B, C, D, E, F, S>,
        description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>
    ): void {
        this._all('get', uriPath, checkUserLogin, handler, description);
    }

    /**
     * Alias for post registration
     * @param {string|string[]} uriPath
     * @param {boolean|DefaultRouteCheckUserLogin} checkUserLogin
     * @param {DefaultRouteHandlerPost} handler
     * @param {DefaultRouteMethodeDescription} description
     * @protected
     */
    protected _post<A, B, C, D, E, F, G, S>(
        uriPath: string|string[],
        checkUserLogin: boolean|DefaultRouteCheckUserLogin,
        handler: DefaultRouteHandler<A, B, C, D, E, F, S>,
        description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>
    ): void {
        this._all('post', uriPath, checkUserLogin, handler, description);
    }

    /**
     *
     * @param method
     * @param uriPath
     * @param checkUserLogin
     * @param handler
     * @param description
     * @protected
     */
    protected _all<A, B, C, D, E, F, G, S>(
        method: string,
        uriPath: string|string[],
        checkUserLogin: boolean|DefaultRouteCheckUserLogin,
        handler: DefaultRouteHandler<A, B, C, D, E, F, S>,
        description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>
    ): void {
        const cMethod = method.toLowerCase();
        const urls = Array.isArray(uriPath) ? uriPath : [uriPath];
        const routeHandle = async(req: Request, res: Response) => {
            try {
                // check login -----------------------------------------------------------------------------------------

                if (description.useLocalStorage) {
                    RequestContext.getInstance().enterWith(new Map<string, any>());
                }

                if (typeof checkUserLogin === 'function') {
                    if (!await checkUserLogin(req, res)) {
                        return;
                    }
                } else if (checkUserLogin) {
                    if (!DefaultRouteCheckUserIsLogin(req)) {
                        return;
                    }
                }

                // check schemas ---------------------------------------------------------------------------------------

                let headers: undefined|A = undefined;
                let params: undefined|C = undefined;
                let query: undefined|B = undefined;
                let cookies: undefined|D = undefined;
                let session: undefined|S = undefined;
                let body: undefined|E = undefined;

                if (description.headerSchema) {
                    if (this.isSchemaValidate(description.headerSchema, req.headers, res)) {
                        headers = req.headers;
                    } else {
                        return;
                    }
                }

                if (description.pathSchema) {
                    if (this.isSchemaValidate(description.pathSchema, req.params, res)) {
                        params = req.params;
                    } else {
                        return;
                    }
                }

                if (description.querySchema) {
                    if (this.isSchemaValidate(description.querySchema, req.query, res)) {
                        query = req.query;
                    } else {
                        return;
                    }
                }

                if (description.cookieSchema) {
                    if (this.isSchemaValidate(description.cookieSchema, req.cookies, res)) {
                        cookies = req.cookies;
                    } else {
                        return;
                    }
                }

                if (description.sessionSchema) {
                    if (this.isSchemaValidate(description.sessionSchema, req.session, res)) {
                        session = req.session;
                    } else {
                        return;
                    }
                }

                if (description.bodySchema) {
                    if (this.isSchemaValidate(description.bodySchema, req.body, res)) {
                        body = req.body;
                    } else {
                        return;
                    }
                }

                // call handler ----------------------------------------------------------------------------------------

                const result = await handler(
                    req,
                    res,
                    {
                        headers: headers,
                        params: params,
                        query: query,
                        cookies: cookies,
                        session: session,
                        body: body
                    }
                );

                // check response --------------------------------------------------------------------------------------

                if (description.responseBodySchema) {
                    if (description.responseBodySchema.validate(result, [])) {
                        res.status(200).json(result);
                    } else {
                        throw new Error(`The result have a error in: ${description.responseBodySchema.describe().description}`);
                    }
                }
            } catch (ie) {
                if (ie instanceof RouteError) {
                    if (ie.asJson()) {
                        res.status(200).json(ie.defaultReturn());
                    } else {
                        res.status(parseInt(ie.getStatus(), 10) ?? 500).send(ie.getRawMsg());
                    }

                    return;
                }

                Logger.getLogger().error('DefaultRoute::_all<%0>::routeHandle: Exception intern, path can not call: %0', cMethod, uriPath);
            }
        };

        for (const url of urls) {
            const params = [];

            params.push(url);

            if (description.parser) {
                params.push(description.parser);
            }

            params.push(routeHandle);

            try {
                (this._routes as any)[cMethod](...params);

                if (SwaggerUIRoute.hasInstance()) {
                    switch (cMethod) {
                        case 'get':
                            SwaggerUIRoute.getInstance().registerGet(url, description);
                            break;

                        case 'post':
                            SwaggerUIRoute.getInstance().registerPost(url, description);
                            break;
                    }
                }
            } catch (e) {
                Logger.getLogger().error('DefaultRoute::_all<%0>: Exception extern, path can not call: %0', cMethod, uriPath);
            }
        }
    }
}