import { Router } from 'express';
import { Logger } from '../../../Logger/Logger.js';
import { SchemaRequestData } from '../../../Schemas/Server/RequestData.js';
import { StatusCodes } from '../../../Schemas/Server/Routes/StatusCodes.js';
import { Session } from '../Session.js';
import path from 'path';
import { RouteError } from './RouteError.js';
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
    isSchemaValidate(schema, data, res, autoSend = true) {
        const errors = [];
        if (!schema.validate(data, errors)) {
            if (autoSend) {
                res.status(200).json({
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: JSON.stringify(errors, null, 2)
                });
            }
            return false;
        }
        return true;
    }
    isUserLogin(req, res, sendAutoResoonse = true) {
        if (SchemaRequestData.validate(req, [])) {
            if (Session.isUserLogin(req.session)) {
                return true;
            }
        }
        if (sendAutoResoonse) {
            throw new RouteError(StatusCodes.UNAUTHORIZED, 'User is unauthorized!');
        }
        return false;
    }
    getExpressRouter() {
        return this._routes;
    }
    _get(uriPath, checkUserLogin, handler, description) {
        try {
            this._routes.get(uriPath, async (req, res) => {
                try {
                    if (checkUserLogin) {
                        if (!this.isUserLogin(req, res)) {
                            return;
                        }
                    }
                    let headers = undefined;
                    let params = undefined;
                    let query = undefined;
                    let cookies = undefined;
                    let session = undefined;
                    if (description.headerSchema) {
                        if (this.isSchemaValidate(description.headerSchema, req.headers, res)) {
                            headers = req.headers;
                        }
                        else {
                            return;
                        }
                    }
                    if (description.pathSchema) {
                        if (this.isSchemaValidate(description.pathSchema, req.params, res)) {
                            params = req.params;
                        }
                        else {
                            return;
                        }
                    }
                    if (description.querySchema) {
                        if (this.isSchemaValidate(description.querySchema, req.query, res)) {
                            query = req.query;
                        }
                        else {
                            return;
                        }
                    }
                    if (description.cookieSchema) {
                        if (this.isSchemaValidate(description.cookieSchema, req.cookies, res)) {
                            cookies = req.cookies;
                        }
                        else {
                            return;
                        }
                    }
                    if (description.sessionSchema) {
                        if (this.isSchemaValidate(description.sessionSchema, req.session, res)) {
                            session = req.session;
                        }
                        else {
                            return;
                        }
                    }
                    const result = await handler(req, res, {
                        headers: headers,
                        params: params,
                        query: query,
                        cookies: cookies,
                        session: session
                    });
                    res.status(200).json(result);
                }
                catch (ie) {
                    if (ie instanceof RouteError) {
                        if (ie.asJson()) {
                            res.status(200).json(ie.defaultReturn());
                        }
                        else {
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
        }
        catch (e) {
            Logger.getLogger().error(`DefaultRoute::_get: Exception extern, path can not call: %0$`, uriPath);
        }
    }
    _post(uriPath, checkUserLogin, handler, description) {
        try {
            this._routes.post(uriPath, async (req, res) => {
                try {
                    if (checkUserLogin) {
                        if (!this.isUserLogin(req, res)) {
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
                        if (this.isSchemaValidate(description.headerSchema, req.headers, res)) {
                            headers = req.headers;
                        }
                        else {
                            return;
                        }
                    }
                    if (description.pathSchema) {
                        if (this.isSchemaValidate(description.pathSchema, req.params, res)) {
                            params = req.params;
                        }
                        else {
                            return;
                        }
                    }
                    if (description.querySchema) {
                        if (this.isSchemaValidate(description.querySchema, req.query, res)) {
                            query = req.query;
                        }
                        else {
                            return;
                        }
                    }
                    if (description.cookieSchema) {
                        if (this.isSchemaValidate(description.cookieSchema, req.cookies, res)) {
                            cookies = req.cookies;
                        }
                        else {
                            return;
                        }
                    }
                    if (description.sessionSchema) {
                        if (this.isSchemaValidate(description.sessionSchema, req.session, res)) {
                            session = req.session;
                        }
                        else {
                            return;
                        }
                    }
                    if (description.bodySchema) {
                        if (this.isSchemaValidate(description.bodySchema, req.body, res)) {
                            body = req.body;
                        }
                        else {
                            return;
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
                    res.status(200).json(result);
                }
                catch (ie) {
                    if (ie instanceof RouteError) {
                        if (ie.asJson()) {
                            res.status(200).json(ie.defaultReturn());
                        }
                        else {
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
        }
        catch (e) {
            Logger.getLogger().error('DefaultRoute::_post: Exception extern, path can not call: %0', uriPath);
        }
    }
}
//# sourceMappingURL=DefaultRoute.js.map