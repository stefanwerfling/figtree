import { Router } from 'express';
import { DefaultRoute } from './DefaultRoute.js';
export declare class ServiceRoute extends DefaultRoute {
    protected _backendInstanceName: string;
    protected _onlyUserAccess: boolean;
    constructor(backendInstanceName: string, onlyUserAccess?: boolean);
    getExpressRouter(): Router;
}
