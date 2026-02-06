import {Request, RequestHandler, Response, Router} from 'express';
import {DefaultReturn, StatusCodes} from 'figtree-schemas';
import {ACLRight} from '../../../ACL/ACLRight.js';
import {Logger} from '../../../Logger/Logger.js';
import {StringHelper} from '../../../Utils/StringHelper.js';
import {VtsSchemaError} from '../../../VtsExtend/VtsSchemaError.js';
import {Session} from '../Session.js';
import path from 'path';
import {Schema, SchemaErrors} from 'vts';
import {DefaultRouteCheckUserIsLogin, DefaultRouteCheckUserLogin} from './DefaultRouteCheckUser.js';
import {IDefaultRoute} from './IDefaultRoute.js';
import {RequestContext} from './RequestContext.js';
import {RouteError} from './RouteError.js';
import {SchemaRouteError} from './SchemaRouteError.js';
import {SwaggerUIRoute} from './SwaggerUIRoute.js';

/**
 * DefaultRouteHandler
 */
export type DefaultRouteHandler<
    Header,
    Query,
    Path,
    Cookies,
    Body,
    Result,
    Session
> = (
    request: Request,
    response: Response,
    data: {
        headers: Header|undefined
        params: Path|undefined,
        query: Query|undefined,
        cookies: Cookies|undefined,
        session: Session|undefined,
        body: Body|undefined
    }
) => Promise<Result>;

/**
 * Default route session init Handler
 */
export type DefaultRouteSessionInitHandler<SessionUser> = () => Promise<SessionUser>;

/**
 * DefaultRouteMethodeDescription
 */
export type DefaultRouteMethodeDescription<
    Header,
    Query,
    Path,
    Cookies,
    Body,
    ResponseBody,
    ResponseHeader,
    Session,
    SessionUser
> = {
    description?: string;
    tags?: string[];
    headerSchema?: Schema<Header>;
    querySchema?: Schema<Query>;
    pathSchema?: Schema<Path>;
    cookieSchema?: Schema<Cookies>;
    bodySchema?: Schema<Body>;
    responseBodySchema?: Schema<ResponseBody>;
    responseHeaderSchema?: Schema<ResponseHeader>;
    sessionSchema?: Schema<Session>;
    sessionInit?: DefaultRouteSessionInitHandler<SessionUser>;
    parser?: RequestHandler,
    useLocalStorage?: boolean;
    aclRight?: ACLRight;
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
     * @param {string} descriptionName
     * @param {boolean} throwError
     * @template T
     * @return {boolean}
     * @throws {SchemaRouteError}
     */
    public isSchemaValidate<T>(
        schema: Schema<T>,
        data: unknown,
        descriptionName: string,
        throwError: boolean = true
    ): data is T {
        const errors: SchemaErrors = [];

        if (schema.validate(data, errors)) {
            return true;
        }

        if (throwError) {
            throw new SchemaRouteError(schema, data, errors, descriptionName);
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
     * Alias for get registration
     * @param {string|string[]} uriPath
     * @param {boolean|DefaultRouteCheckUserLogin} checkUserLogin
     * @param {DefaultRouteHandlerPost} handler
     * @param {DefaultRouteMethodeDescription} description
     * @protected
     */
    protected _get<
        Header,
        Query,
        Path,
        Cookies,
        Body,
        ResponseBody,
        ResponseHeader,
        Session,
        SessionUser
    >(
        uriPath: string|string[],
        checkUserLogin: boolean|DefaultRouteCheckUserLogin,
        handler: DefaultRouteHandler<
            Header,
            Query,
            Path,
            Cookies,
            Body,
            ResponseBody,
            Session
        >,
        description: DefaultRouteMethodeDescription<
            Header,
            Query,
            Path,
            Cookies,
            Body,
            ResponseBody,
            ResponseHeader,
            Session,
            SessionUser
        >
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
    protected _post<
        Header,
        Query,
        Path,
        Cookies,
        Body,
        ResponseBody,
        ResponseHeader,
        Session,
        SessionUser
    >(
        uriPath: string|string[],
        checkUserLogin: boolean|DefaultRouteCheckUserLogin,
        handler: DefaultRouteHandler<
            Header,
            Query,
            Path,
            Cookies,
            Body,
            ResponseBody,
            Session
        >,
        description: DefaultRouteMethodeDescription<
            Header,
            Query,
            Path,
            Cookies,
            Body,
            ResponseBody,
            ResponseHeader,
            Session,
            SessionUser
        >
    ): void {
        this._all('post', uriPath, checkUserLogin, handler, description);
    }

    /**
     * All methodes
     * @param {string} method
     * @param {string|string[]} uriPath
     * @param {boolean|DefaultRouteCheckUserLogin}checkUserLogin
     * @param {DefaultRouteHandler} handler
     * @param {DefaultRouteMethodeDescription} description
     * @protected
     */
    protected _all<
        Header,
        Query,
        Path,
        Cookies,
        Body,
        ResponseBody,
        ResponseHeader,
        Session,
        SessionUser
    >(
        method: string,
        uriPath: string|string[],
        checkUserLogin: boolean|DefaultRouteCheckUserLogin,
        handler: DefaultRouteHandler<
            Header,
            Query,
            Path,
            Cookies,
            Body,
            ResponseBody,
            Session
        >,
        description: DefaultRouteMethodeDescription<
            Header,
            Query,
            Path,
            Cookies,
            Body,
            ResponseBody,
            ResponseHeader,
            Session,
            SessionUser
        >
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
                    if (!await checkUserLogin(req, res, description.aclRight)) {
                        return;
                    }
                } else if (checkUserLogin) {
                    if (!DefaultRouteCheckUserIsLogin(req)) {
                        return;
                    }
                }

                // check schemas ---------------------------------------------------------------------------------------

                let headers: undefined|Header = undefined;
                let params: undefined|Path = undefined;
                let query: undefined|Query = undefined;
                let cookies: undefined|Cookies = undefined;
                let session: undefined|Session = undefined;
                let body: undefined|Body = undefined;

                if (description.headerSchema) {
                    if (this.isSchemaValidate(description.headerSchema, req.headers, 'Header')) {
                        headers = req.headers;
                    }
                }

                if (description.pathSchema) {
                    if (this.isSchemaValidate(description.pathSchema, req.params, 'Path')) {
                        params = req.params;
                    }
                }

                if (description.querySchema) {
                    if (this.isSchemaValidate(description.querySchema, req.query, 'Query')) {
                        query = req.query;
                    }
                }

                if (description.cookieSchema) {
                    if (this.isSchemaValidate(description.cookieSchema, req.cookies, 'Cookies')) {
                        cookies = req.cookies;
                    }
                }

                if (description.sessionSchema) {
                    if (this.isSchemaValidate(description.sessionSchema, req.session, 'Session', false)) {
                        session = req.session;
                    } else {
                        if (description.sessionInit) {
                            req.session.user = await description.sessionInit();

                            if (this.isSchemaValidate(description.sessionSchema, req.session, 'Session2')) {
                                session = req.session;
                            }
                        } else {
                            req.session.user = Session.defaultInitSession();

                            if (this.isSchemaValidate(description.sessionSchema, req.session, 'Session3')) {
                                session = req.session;
                            }
                        }
                    }
                }

                if (description.bodySchema) {
                    if (this.isSchemaValidate(description.bodySchema, req.body, 'Body')) {
                        body = req.body;
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
                        throw new Error(
                            StringHelper.sprintf(
                                'The result have a error in: %s',
                                description.responseBodySchema.describe().description
                            )
                        );
                    }
                } else {
                    // no content
                    res.sendStatus(204);
                    return;
                }
            } catch (ie) {
                if (ie instanceof VtsSchemaError) {
                    Logger.getLogger().error(ie.toString());
                }

                if (ie instanceof RouteError) {
                    if (ie.asJson()) {
                        res.status(200).json(ie.defaultReturn());
                    } else {
                        res.status(parseInt(ie.getStatus(), 10) ?? 500).send(ie.getRawMsg());
                    }

                    return;
                }

                Logger.getLogger().error(
                    StringHelper.sprintf(
                        'DefaultRoute::_all<%s>::routeHandle: Exception intern, path can not call: %s sessionid: %s error: %e',
                        cMethod,
                        uriPath,
                        req.session.id ?? 'none',
                        ie
                    )
                );

                res.status(200).json({
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'Internal error, check the server logs.'
                } as DefaultReturn);

                return;
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
                Logger.getLogger().error(
                    StringHelper.sprintf(
                        'DefaultRoute::_all<%s>: Exception extern, path can not call: %s error: %e',
                        cMethod,
                        uriPath,
                        e
                    )
                );
            }
        }
    }
}