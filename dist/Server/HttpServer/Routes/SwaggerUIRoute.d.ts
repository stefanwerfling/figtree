import { Router } from 'express';
import { DefaultRouteMethodeDescription } from './DefaultRoute.js';
import { IDefaultRoute } from './IDefaultRoute.js';
export declare class SwaggerUIRoute implements IDefaultRoute {
    protected static _instance: SwaggerUIRoute | null;
    static getInstance(): SwaggerUIRoute;
    static hasInstance(): boolean;
    protected _openApiSpec: any;
    setInfo(title?: string, version?: string): void;
    protected _addRouteToSwagger<A, B, C, D, E, F, G, S>(url: string, method: string, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void;
    registerPost<A, B, C, D, E, F, G, S>(url: string, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void;
    registerGet<A, B, C, D, E, F, G, S>(url: string, description: DefaultRouteMethodeDescription<A, B, C, D, E, F, G, S>): void;
    getExpressRouter(): Router;
}
