import { Router } from 'express';
import { DefaultRoute, DefaultRouteMethodeDescription } from './DefaultRoute.js';
export declare class SwaggerUIRoute extends DefaultRoute {
    protected static _instance: SwaggerUIRoute | null;
    static getInstance(): SwaggerUIRoute;
    static hasInstance(): boolean;
    protected _openApiSpec: any;
    setInfo(title?: string, version?: string): void;
    protected _convertToOpenApiResponse(obj: any, statusCode?: string): any;
    registerPost<T>(url: string, description: DefaultRouteMethodeDescription<T>): void;
    registerGet<T>(url: string, description: DefaultRouteMethodeDescription<T>): void;
    protected _addRouteToSwagger(path: string, method: string, spec: any): void;
    getExpressRouter(): Router;
}
