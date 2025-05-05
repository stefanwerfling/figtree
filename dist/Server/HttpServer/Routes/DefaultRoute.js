import { Router } from 'express';
import { Logger } from '../../../Logger/Logger.js';
import { SchemaRequestData } from '../../../Schemas/Server/RequestData.js';
import { StatusCodes } from '../../../Schemas/Server/Routes/StatusCodes.js';
import { Session } from '../Session.js';
import path from 'path';
export class DefaultRoute {
    _routes;
    _uriBase = '/json/';
    constructor() {
        this._routes = Router();
    }
    _getUrl(version, base, controller) {
        return path.join(this._uriBase, version, base, controller);
    }
    isSchemaValidate(schema, data, res) {
        const errors = [];
        if (!schema.validate(data, errors)) {
            res.status(200).json({
                statusCode: StatusCodes.INTERNAL_ERROR,
                msg: JSON.stringify(errors, null, 2)
            });
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
            res.status(200).json({
                statusCode: StatusCodes.UNAUTHORIZED
            });
        }
        return false;
    }
    getExpressRouter() {
        return this._routes;
    }
    _get(uriPath, checkUserLogin, handler) {
        try {
            this._routes.get(uriPath, async (req, res) => {
                try {
                    if (checkUserLogin) {
                        if (!this.isUserLogin(req, res)) {
                            return;
                        }
                    }
                    handler(req, res);
                }
                catch (ie) {
                    Logger.getLogger().error('DefaultRoute::_get: Exception intern, path can not call: %0', uriPath);
                }
            });
        }
        catch (e) {
            Logger.getLogger().error(`DefaultRoute::_get: Exception extern, path can not call: %0$`, uriPath);
        }
    }
    _post(uriPath, checkUserLogin, handler) {
        try {
            this._routes.post(uriPath, async (req, res) => {
                try {
                    if (checkUserLogin) {
                        if (!this.isUserLogin(req, res)) {
                            return;
                        }
                    }
                    handler(req, res);
                }
                catch (ie) {
                    Logger.getLogger().error('DefaultRoute::_post: Exception intern, path can not call: %0', uriPath);
                }
            });
        }
        catch (e) {
            Logger.getLogger().error('DefaultRoute::_post: Exception extern, path can not call: %0', uriPath);
        }
    }
}
//# sourceMappingURL=DefaultRoute.js.map