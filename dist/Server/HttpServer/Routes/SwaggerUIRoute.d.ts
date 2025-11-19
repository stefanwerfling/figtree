import { Router } from 'express';
import { DefaultRouteMethodeDescription } from './DefaultRoute.js';
import { IDefaultRoute } from './IDefaultRoute.js';
export declare class SwaggerUIRoute implements IDefaultRoute {
    protected static _instance: SwaggerUIRoute | null;
    static getInstance(): SwaggerUIRoute;
    static hasInstance(): boolean;
    protected _openApiSpec: any;
    setInfo(title?: string, version?: string): void;
    protected _addRouteToSwagger<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>(url: string, method: string, description: DefaultRouteMethodeDescription<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>): void;
    registerPost<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>(url: string, description: DefaultRouteMethodeDescription<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>): void;
    registerGet<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>(url: string, description: DefaultRouteMethodeDescription<Header, Query, Path, Cookies, Body, ResponseBody, ResponseHeader, Session, SessionUser>): void;
    getExpressRouter(): Router;
}
