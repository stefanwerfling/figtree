import { Router } from 'express';
import { DefaultRoute } from './DefaultRoute.js';
export declare class SwaggerUIRoute extends DefaultRoute {
    protected _openApiSpec: any;
    constructor(title?: string, version?: string);
    getExpressRouter(): Router;
}
