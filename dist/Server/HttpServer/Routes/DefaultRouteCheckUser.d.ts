import { Request, Response } from 'express';
import { RequestData } from 'figtree-schemas';
import { ObjectSchema } from 'vts';
export type DefaultRouteCheckUserLogin<REQ extends Request = Request, RESP extends Response = Response> = (request: REQ, response: RESP, aclRight?: string) => Promise<boolean>;
export declare const DefaultRouteCheckUserIsLoginACL: (req: unknown, res: Response, aclRight?: string) => Promise<boolean>;
export declare const DefaultRouteCheckUserIsLogin: (req: unknown, sendAutoResoonse?: boolean, schemaRequestData?: ObjectSchema<{
    session: import("vts").ObjectSchema<{
        id: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        user: import("vts").ObjectSchema<{
            isLogin: import("vts").BooleanSchema;
            userid: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            role: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        }>;
    }>;
}>) => req is RequestData;
