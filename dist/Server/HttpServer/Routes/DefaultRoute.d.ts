import { Request, Response, Router } from 'express';
import { RequestData } from '../../../Schemas/Server/RequestData.js';
import { Schema } from 'vts';
import { IDefaultRoute } from './IDefaultRoute.js';
export type DefaultRouteHandlerGet<A, B, C, D, E, F, G> = (request: Request, response: Response, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G>) => void;
export type DefaultRouteHandlerPost<A, B, C, D, E, F, G> = (request: Request, response: Response, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G>) => void;
export type DefaultRouteMethodeDescription<A, B, C, D, E, F, G> = {
    description?: string;
    headerSchema?: Schema<A>;
    querySchema?: Schema<B>;
    pathSchema?: Schema<C>;
    cookieSchema?: Schema<D>;
    bodySchema?: Schema<E>;
    responseBodySchema?: Schema<F>;
    responseHeaderSchema?: Schema<G>;
};
export declare class DefaultRoute implements IDefaultRoute {
    protected _routes: Router;
    protected _uriBase: string;
    constructor();
    protected _getUrl(version: string, base: string, controller: string): string;
    isSchemaValidate<T>(schema: Schema<T>, data: unknown, res: Response): data is T;
    isUserLogin(req: unknown, res: Response, sendAutoResoonse?: boolean): req is RequestData;
    getExpressRouter(): Router;
    protected _get<A, B, C, D, E, F, G>(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerGet<A, B, C, D, E, F, G>, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G>): void;
    protected _post<A, B, C, D, E, F, G>(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerPost<A, B, C, D, E, F, G>, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G>): void;
}
