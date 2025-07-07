import { Router } from 'express';
import { ACLRight } from '../../../ACL/ACLRight.js';
import { DefaultRoute } from './DefaultRoute.js';
import { DefaultRouteCheckUserLogin } from './DefaultRouteCheckUser.js';
export type ServiceRouteACLRights = {
    status: ACLRight;
    start: ACLRight;
    stop: ACLRight;
};
export declare class ServiceRoute extends DefaultRoute {
    protected _backendInstanceName: string;
    protected _onlyUserAccess: boolean | DefaultRouteCheckUserLogin;
    protected _accessRights?: ServiceRouteACLRights;
    constructor(backendInstanceName: string, onlyUserAccess?: boolean | DefaultRouteCheckUserLogin, accessRights?: ServiceRouteACLRights);
    getExpressRouter(): Router;
}
