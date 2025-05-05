import { Request, Response, Router } from 'express';
import { RequestData } from '../../../Schemas/Server/RequestData.js';
import { Schema } from 'vts';
export type DefaultRouteHandlerGet = (request: Request, response: Response) => void;
export type DefaultRouteHandlerPost = (request: Request, response: Response) => void;
export declare class DefaultRoute {
    protected _routes: Router;
    protected _uriBase: string;
    constructor();
    protected _getUrl(version: string, base: string, controller: string): string;
    isSchemaValidate<T>(schema: Schema<T>, data: unknown, res: Response): data is T;
    isUserLogin(req: unknown, res: Response, sendAutoResoonse?: boolean): req is RequestData;
    getExpressRouter(): Router;
    protected _get(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerGet): void;
    protected _post(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerPost): void;
}
