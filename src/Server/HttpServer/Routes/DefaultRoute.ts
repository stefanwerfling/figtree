import {Request, Response, Router} from 'express';
import {Logger} from '../../../Logger/Logger.js';
import {RequestData, SchemaRequestData} from '../../../Schemas/Server/RequestData.js';
import {StatusCodes} from '../../../Schemas/Server/Routes/StatusCodes.js';
import {Session} from '../Session.js';
import {DefaultReturn} from './../../../Schemas/Server/Routes/DefaultReturn.js';
import path from 'path';
import {Schema, SchemaErrors} from 'vts';
import {IDefaultRoute} from './IDefaultRoute.js';
import {RequestContext} from './RequestContext.js';
import {RouteError} from './RouteError.js';
import {SwaggerUIRoute} from './SwaggerUIRoute.js';

/**
 * DefaultRouteHandlerGet
 */
export type DefaultRouteHandlerGet<A, B, C, D, F, S> = (
    request: Request,
    response: Response,
    data: {
        headers: A|undefined
        params: C|undefined,
        query: B|undefined,
        cookies: D|undefined,
        session: S|undefined
    }
) => Promise<F>;

/**
 * DefaultRouteHandlerPost
 */
export type DefaultRouteHandlerPost<A, B, C, D, E, F, S> = (
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
    headerSchema?: Schema<A>;
    querySchema?: Schema<B>;
    pathSchema?: Schema<C>;
    cookieSchema?: Schema<D>;
    bodySchema?: Schema<E>;
    responseBodySchema?: Schema<F>;
    responseHeaderSchema?: Schema<G>;
    sessionSchema?: Schema<S>;
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
     * Is User Login
     * @param {unknown} req
     * @param {boolean} sendAutoResoonse
     */
    public isUserLogin(
        req: unknown,
        sendAutoResoonse: boolean = true
    ): req is RequestData {
        if (SchemaRequestData.validate(req, [])) {
            if (Session.isUserLogin(req.session)) {
                return true;
            }

            const store = new Map<string, any>();

            store.set(RequestContext.SESSIONID, req.session.id);
            store.set(RequestContext.USERID, '');
            store.set(RequestContext.ISLOGIN, false);

            if (req.session.user) {
                store.set(RequestContext.USERID, req.session.user.userid);
                store.set(RequestContext.ISLOGIN, req.session.user.isLogin);
            }

            RequestContext.getInstance().enterWith(store);
        }

        if (sendAutoResoonse) {
            throw new RouteError(StatusCodes.UNAUTHORIZED, 'User is unauthorized!');
        }

        return false;
    }

    /**
     * Het Express Router
     * @return {Router}
     */
    public getExpressRouter(): Router {
        return this._routes;
    }

    /**
     * _get
     * @param {string} uriPath
     * @param {boolean} checkUserLogin
     * @param {DefaultRouteHandlerGet} handler
     * @param {DefaultRouteMethodeDescription} description
     * @protected
     */
    protected _get<A, B, C, D, E, F, G, S>(
        uriPath: string,
        checkUserLogin: boolean,
        handler: DefaultRouteHandlerGet<A, B, C, D, F, S>,
        description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>
    ): void {
        try {
            this._routes.get(uriPath, async(req, res) => {
                try {
                    if (checkUserLogin) {
                        if (!this.isUserLogin(req)) {
                            return;
                        }
                    }

                    let headers: undefined|A = undefined;
                    let params: undefined|C = undefined;
                    let query: undefined|B = undefined;
                    let cookies: undefined|D = undefined;
                    let session: undefined|S = undefined;

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

                    const result = await handler(
                        req,
                        res,
                        {
                            headers: headers,
                            params: params,
                            query: query,
                            cookies: cookies,
                            session: session
                        }
                    );

                    if (description.responseBodySchema) {
                        const error: SchemaErrors = [];

                        if (description.responseBodySchema.validate(result, error)) {
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

                    Logger.getLogger().error('DefaultRoute::_get: Exception intern, path can not call: %0', uriPath);
                }
            });

            if (SwaggerUIRoute.hasInstance()) {
                SwaggerUIRoute.getInstance().registerGet(uriPath, description);
            }
        } catch (e) {
            Logger.getLogger().error(`DefaultRoute::_get: Exception extern, path can not call: %0$`, uriPath);
        }
    }

    /**
     * _post
     * @param {string} uriPath
     * @param {boolean} checkUserLogin
     * @param {DefaultRouteHandlerPost} handler
     * @param {DefaultRouteMethodeDescription} description
     * @protected
     */
    protected _post<A, B, C, D, E, F, G, S>(
        uriPath: string,
        checkUserLogin: boolean,
        handler: DefaultRouteHandlerPost<A, B, C, D, E, F, S>,
        description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>
    ): void {
        try {
            this._routes.post(uriPath, async(req, res) => {
                try {
                    if (checkUserLogin) {
                        if (!this.isUserLogin(req)) {
                            return;
                        }
                    }

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

                    if (description.responseBodySchema) {
                        const error: SchemaErrors = [];

                        if (description.responseBodySchema.validate(result, error)) {
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

                    Logger.getLogger().error('DefaultRoute::_post: Exception intern, path can not call: %0', uriPath);
                }
            });

            if (SwaggerUIRoute.hasInstance()) {
                SwaggerUIRoute.getInstance().registerPost(uriPath, description);
            }
        } catch (e) {
            Logger.getLogger().error('DefaultRoute::_post: Exception extern, path can not call: %0', uriPath);
        }
    }

}