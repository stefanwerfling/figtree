import { Router } from 'express';
import { ExtractSchemaResultType, Schema } from 'vts';
import { ACLRight } from '../../../ACL/ACLRight.js';
import { DefaultRoute } from './DefaultRoute.js';
import { DefaultRouteCheckUserLogin } from './DefaultRouteCheckUser.js';
export declare const SchemaServiceClusterStatusResponse: import("vts").ObjectSchema<{
    statusCode: import("vts").OrSchema<Schema<unknown, import("vts").SchemaOptions>>;
    msg: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    workers: import("vts").Object2Schema<import("vts").StringSchema<import("vts").StringSchemaOptions>, import("vts").ArraySchema<import("vts").ObjectSchema<{
        type: import("vts").EnumSchema<import("figtree-schemas").ServiceType>;
        name: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        status: import("vts").EnumSchema<import("figtree-schemas").ServiceStatus>;
        statusMsg: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        importance: import("vts").EnumSchema<import("figtree-schemas").ServiceImportance>;
        inProcess: import("vts").BooleanSchema;
        dependencies: import("vts").ArraySchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        scheduler: import("vts").OptionalSchema<import("vts").ObjectSchema<{
            status: import("vts").EnumSchema<import("figtree-schemas").ServiceStatus>;
            inProcess: import("vts").BooleanSchema;
            lastRun: import("vts").OrSchema<import("vts").StringSchema<import("vts").StringSchemaOptions> | import("vts").NullSchema>;
            cron: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        }>>;
    }>>>;
}>;
export type ServiceClusterStatusResponse = ExtractSchemaResultType<typeof SchemaServiceClusterStatusResponse>;
export type ServiceRouteACLRights = {
    status: ACLRight;
    start: ACLRight;
    stop: ACLRight;
    invoke: ACLRight;
    clusterStatus?: ACLRight;
};
export declare class ServiceRoute extends DefaultRoute {
    protected _backendInstanceName: string;
    protected _onlyUserAccess: boolean | DefaultRouteCheckUserLogin;
    protected _accessRights?: ServiceRouteACLRights;
    constructor(backendInstanceName: string, onlyUserAccess?: boolean | DefaultRouteCheckUserLogin, accessRights?: ServiceRouteACLRights);
    getExpressRouter(): Router;
}
