import { Request, Response, Router } from 'express';
import { RequestData } from '../../../Schemas/Server/RequestData.js';
import { Schema } from 'vts';
import { IDefaultRoute } from './IDefaultRoute.js';
export type DefaultRouteHandlerGet<T> = (request: Request, response: Response, description: DefaultRouteMethodeDescription<T>) => void;
export type DefaultRouteHandlerPost<T> = (request: Request, response: Response, description: DefaultRouteMethodeDescription<T>) => void;
export type DefaultRouteMethodeDescription<T> = {
    description?: string;
    headerSchema?: Schema<T>;
    querySchema?: Schema<T>;
    pathSchema?: Schema<T>;
    cookieSchema?: Schema<T>;
    bodySchema?: Schema<T>;
    responseBodySchema?: Schema<T>;
    responseHeaderSchema?: Schema<T>;
};
export declare class DefaultRoute implements IDefaultRoute {
    protected _routes: Router;
    protected _uriBase: string;
    constructor();
    protected _getUrl(version: string, base: string, controller: string): string;
    isSchemaValidate<T>(schema: Schema<T>, data: unknown, res: Response): data is T;
    isUserLogin(req: unknown, res: Response, sendAutoResoonse?: boolean): req is RequestData;
    getExpressRouter(): Router;
    protected _get<T>(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerGet<T>, description: DefaultRouteMethodeDescription<T>): void;
    protected _post<T>(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerPost<T>, description: DefaultRouteMethodeDescription<T>): void;
}
