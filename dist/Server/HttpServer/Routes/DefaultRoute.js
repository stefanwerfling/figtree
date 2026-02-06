import { Router } from 'express';
import { StatusCodes } from 'figtree-schemas';
import { Logger } from '../../../Logger/Logger.js';
import { StringHelper } from '../../../Utils/StringHelper.js';
import { VtsSchemaError } from '../../../VtsExtend/VtsSchemaError.js';
import { Session } from '../Session.js';
import path from 'path';
import { DefaultRouteCheckUserIsLogin } from './DefaultRouteCheckUser.js';
import { RequestContext } from './RequestContext.js';
import { RouteError } from './RouteError.js';
import { SchemaRouteError } from './SchemaRouteError.js';
import { SwaggerUIRoute } from './SwaggerUIRoute.js';
export class DefaultRoute {
    _routes;
    _uriBase = '/json/';
    constructor() {
        this._routes = Router();
    }
    _getUrl(version, base, controller) {
        return path.join(this._uriBase, version, base, controller);
    }
    isSchemaValidate(schema, data, descriptionName, throwError = true) {
        const errors = [];
        if (schema.validate(data, errors)) {
            return true;
        }
        if (throwError) {
            throw new SchemaRouteError(schema, data, errors, descriptionName);
        }
        return false;
    }
    getExpressRouter() {
        return this._routes;
    }
    _get(uriPath, checkUserLogin, handler, description) {
        this._all('get', uriPath, checkUserLogin, handler, description);
    }
    _post(uriPath, checkUserLogin, handler, description) {
        this._all('post', uriPath, checkUserLogin, handler, description);
    }
    _all(method, uriPath, checkUserLogin, handler, description) {
        const cMethod = method.toLowerCase();
        const urls = Array.isArray(uriPath) ? uriPath : [uriPath];
        const routeHandle = async (req, res) => {
            try {
                if (description.useLocalStorage) {
                    RequestContext.getInstance().enterWith(new Map());
                }
                if (typeof checkUserLogin === 'function') {
                    if (!await checkUserLogin(req, res, description.aclRight)) {
                        return;
                    }
                }
                else if (checkUserLogin) {
                    if (!DefaultRouteCheckUserIsLogin(req)) {
                        return;
                    }
                }
                let headers = undefined;
                let params = undefined;
                let query = undefined;
                let cookies = undefined;
                let session = undefined;
                let body = undefined;
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
                    }
                    else {
                        if (description.sessionInit) {
                            req.session.user = await description.sessionInit();
                            if (this.isSchemaValidate(description.sessionSchema, req.session, 'Session2')) {
                                session = req.session;
                            }
                        }
                        else {
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
                const result = await handler(req, res, {
                    headers: headers,
                    params: params,
                    query: query,
                    cookies: cookies,
                    session: session,
                    body: body
                });
                if (description.responseBodySchema) {
                    if (description.responseBodySchema.validate(result, [])) {
                        res.status(200).json(result);
                    }
                    else {
                        throw new Error(StringHelper.sprintf('The result have a error in: %s', description.responseBodySchema.describe().description));
                    }
                }
                else {
                    res.sendStatus(204);
                    return;
                }
            }
            catch (ie) {
                if (ie instanceof VtsSchemaError) {
                    Logger.getLogger().error(ie.toString());
                }
                if (ie instanceof RouteError) {
                    if (ie.asJson()) {
                        res.status(200).json(ie.defaultReturn());
                    }
                    else {
                        res.status(parseInt(ie.getStatus(), 10) ?? 500).send(ie.getRawMsg());
                    }
                    return;
                }
                Logger.getLogger().error(StringHelper.sprintf('DefaultRoute::_all<%s>::routeHandle: Exception intern, path can not call: %s sessionid: %s error: %e', cMethod, uriPath, req.session.id ?? 'none', ie));
                res.status(200).json({
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'Internal error, check the server logs.'
                });
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
                this._routes[cMethod](...params);
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
            }
            catch (e) {
                Logger.getLogger().error(StringHelper.sprintf('DefaultRoute::_all<%s>: Exception extern, path can not call: %s error: %e', cMethod, uriPath, e));
            }
        }
    }
}
//# sourceMappingURL=DefaultRoute.js.map