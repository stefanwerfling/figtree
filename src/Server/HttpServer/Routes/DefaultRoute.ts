import {Request, Response, Router} from 'express';
import {Logger} from '../../../Logger/Logger.js';
import {RequestData, SchemaRequestData} from '../../../Schemas/Server/RequestData.js';
import {StatusCodes} from '../../../Schemas/Server/Routes/StatusCodes.js';
import {Session} from '../Session.js';
import {DefaultReturn} from './../../../Schemas/Server/Routes/DefaultReturn.js';
import path from 'path';
import {Schema, SchemaErrors} from 'vts';

/**
 * DefaultRouteHandlerGet
 */
export type DefaultRouteHandlerGet = (request: Request, response: Response) => void;

/**
 * DefaultRouteHandlerPost
 */
export type DefaultRouteHandlerPost = (request: Request, response: Response) => void;

/**
 * DefaultRoute
 */
export class DefaultRoute {

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
     * @template T
     * @return {T}
     */
    public isSchemaValidate<T>(
        schema: Schema<T>,
        data: unknown,
        res: Response
    ): data is T {
        const errors: SchemaErrors = [];

        if (!schema.validate(data, errors)) {
            res.status(200).json({
                statusCode: StatusCodes.INTERNAL_ERROR,
                msg: JSON.stringify(errors, null, 2)
            } as DefaultReturn);

            return false;
        }

        return true;
    }

    /**
     * Is User Login
     * @param {unknown} req
     * @param {Response} res
     * @param {boolean} sendAutoResoonse
     */
    public isUserLogin(
        req: unknown,
        res: Response,
        sendAutoResoonse: boolean = true
    ): req is RequestData {
        if (SchemaRequestData.validate(req, [])) {
            if (Session.isUserLogin(req.session)) {
                return true;
            }
        }

        if (sendAutoResoonse) {
            res.status(200).json({
                statusCode: StatusCodes.UNAUTHORIZED
            } as DefaultReturn);
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
     * @protected
     */
    protected _get(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerGet): void {
        try {
            this._routes.get(uriPath, async(req, res) => {
                try {
                    if (checkUserLogin) {
                        if (!this.isUserLogin(req, res)) {
                            return;
                        }
                    }

                    handler(req, res);
                } catch (ie) {
                    Logger.getLogger().error('DefaultRoute::_get: Exception intern, path can not call: %0', uriPath);
                }
            });
        } catch (e) {
            Logger.getLogger().error(`DefaultRoute::_get: Exception extern, path can not call: %0$`, uriPath);
        }
    }

    /**
     * _post
     * @param {string} uriPath
     * @param {boolean} checkUserLogin
     * @param {DefaultRouteHandlerPost} handler
     * @protected
     */
    protected _post(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerPost): void {
        try {
            this._routes.post(uriPath, async(req, res) => {
                try {
                    if (checkUserLogin) {
                        if (!this.isUserLogin(req, res)) {
                            return;
                        }
                    }

                    handler(req, res);
                } catch (ie) {
                    Logger.getLogger().error('DefaultRoute::_post: Exception intern, path can not call: %0', uriPath);
                }
            });
        } catch (e) {
            Logger.getLogger().error('DefaultRoute::_post: Exception extern, path can not call: %0', uriPath);
        }
    }

}