import { Router } from 'express';
import { ObjectSchemaItems } from 'vts/src/schemas/objectSchema.js';
import { DefaultRoute, DefaultRouteMethodeDescription } from './DefaultRoute.js';
export type SwaggerUIRouteDescription = {
    description: string;
    requestBodySchema: ObjectSchemaItems;
};
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
