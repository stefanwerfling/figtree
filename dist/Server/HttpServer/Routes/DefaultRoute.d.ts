import { Request, Response, Router } from 'express';
import { RequestData } from '../../../Schemas/Server/RequestData.js';
import { Schema } from 'vts';
import { IDefaultRoute } from './IDefaultRoute.js';
export type DefaultRouteHandlerGet<A, B, C, D, F, S> = (request: Request, response: Response, data: {
    headers: A | undefined;
    params: C | undefined;
    query: B | undefined;
    cookies: D | undefined;
    session: S | undefined;
}) => Promise<F>;
export type DefaultRouteHandlerPost<A, B, C, D, E, F, S> = (request: Request, response: Response, data: {
    headers: A | undefined;
    params: C | undefined;
    query: B | undefined;
    cookies: D | undefined;
    session: S | undefined;
    body: E | undefined;
}) => Promise<F>;
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
export declare class DefaultRoute implements IDefaultRoute {
    protected _routes: Router;
    protected _uriBase: string;
    constructor();
    protected _getUrl(version: string, base: string, controller: string): string;
    isSchemaValidate<T>(schema: Schema<T>, data: unknown, res: Response, autoSend?: boolean): data is T;
    isUserLogin(req: unknown, sendAutoResoonse?: boolean): req is RequestData;
    getExpressRouter(): Router;
    protected _get<A, B, C, D, E, F, G, S>(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerGet<A, B, C, D, F, S>, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void;
    protected _post<A, B, C, D, E, F, G, S>(uriPath: string, checkUserLogin: boolean, handler: DefaultRouteHandlerPost<A, B, C, D, E, F, S>, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void;
}
