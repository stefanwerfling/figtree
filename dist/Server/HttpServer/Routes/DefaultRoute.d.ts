import { Request, RequestHandler, Response, Router } from 'express';
import { DefaultHandlerReturn } from 'figtree-schemas';
import { ACLRight } from '../../../ACL/ACLRight.js';
import { Schema } from 'vts';
import { DefaultRouteCheckUserLogin } from './DefaultRouteCheckUser.js';
import { IDefaultRoute } from './IDefaultRoute.js';
export type DefaultRouteHandler<Header, Query, Path, Cookies, Body, Result, Session> = (request: Request, response: Response, data: {
    headers: Header | undefined;
    params: Path | undefined;
    query: Query | undefined;
    cookies: Cookies | undefined;
    session: Session | undefined;
    body: Body | undefined;
}) => Promise<Result | DefaultHandlerReturn>;
export type DefaultRouteSessionInitHandler<SessionUser> = () => Promise<SessionUser>;
export type DefaultRouteMethodeDescription<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser> = {
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
    parser?: RequestHandler;
    useLocalStorage?: boolean;
    aclRight?: ACLRight;
};
export declare class DefaultRoute implements IDefaultRoute {
    protected _routes: Router;
    protected _uriBase: string;
    constructor();
    protected _getUrl(version: string, base: string, controller: string): string;
    isSchemaValidate<T>(schema: Schema<T>, data: unknown, descriptionName: string, throwError?: boolean): data is T;
    getExpressRouter(): Router;
    protected _get<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>(uriPath: string | string[], checkUserLogin: boolean | DefaultRouteCheckUserLogin, handler: DefaultRouteHandler<Header, Query, Path, Cookies, Body, ResponseBody, Session>, description: DefaultRouteMethodeDescription<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>): void;
    protected _post<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>(uriPath: string | string[], checkUserLogin: boolean | DefaultRouteCheckUserLogin, handler: DefaultRouteHandler<Header, Query, Path, Cookies, Body, ResponseBody, Session>, description: DefaultRouteMethodeDescription<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>): void;
    protected _all<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>(method: string, uriPath: string | string[], checkUserLogin: boolean | DefaultRouteCheckUserLogin, handler: DefaultRouteHandler<Header, Query, Path, Cookies, Body, ResponseBody, Session>, description: DefaultRouteMethodeDescription<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>): void;
}
