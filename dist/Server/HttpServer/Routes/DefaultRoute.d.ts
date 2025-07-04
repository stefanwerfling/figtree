import { Request, RequestHandler, Response, Router } from 'express';
import { ACLRight } from '../../../ACL/ACLRight.js';
import { Schema } from 'vts';
import { DefaultRouteCheckUserLogin } from './DefaultRouteCheckUser.js';
import { IDefaultRoute } from './IDefaultRoute.js';
export type DefaultRouteHandler<A, B, C, D, E, F, S> = (request: Request, response: Response, data: {
    headers: A | undefined;
    params: C | undefined;
    query: B | undefined;
    cookies: D | undefined;
    session: S | undefined;
    body: E | undefined;
}) => Promise<F>;
export type DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S> = {
    description?: string;
    tags?: string[];
    headerSchema?: Schema<A>;
    querySchema?: Schema<B>;
    pathSchema?: Schema<C>;
    cookieSchema?: Schema<D>;
    bodySchema?: Schema<E>;
    responseBodySchema?: Schema<F>;
    responseHeaderSchema?: Schema<G>;
    sessionSchema?: Schema<S>;
    parser?: RequestHandler;
    useLocalStorage?: boolean;
    aclRight?: ACLRight;
};
export declare class DefaultRoute implements IDefaultRoute {
    protected _routes: Router;
    protected _uriBase: string;
    constructor();
    protected _getUrl(version: string, base: string, controller: string): string;
    isSchemaValidate<T>(schema: Schema<T>, data: unknown, res: Response, autoSend?: boolean): data is T;
    getExpressRouter(): Router;
    protected _get<A, B, C, D, E, F, G, S>(uriPath: string | string[], checkUserLogin: boolean | DefaultRouteCheckUserLogin, handler: DefaultRouteHandler<A, B, C, D, E, F, S>, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void;
    protected _post<A, B, C, D, E, F, G, S>(uriPath: string | string[], checkUserLogin: boolean | DefaultRouteCheckUserLogin, handler: DefaultRouteHandler<A, B, C, D, E, F, S>, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void;
    protected _all<A, B, C, D, E, F, G, S>(method: string, uriPath: string | string[], checkUserLogin: boolean | DefaultRouteCheckUserLogin, handler: DefaultRouteHandler<A, B, C, D, E, F, S>, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void;
}
