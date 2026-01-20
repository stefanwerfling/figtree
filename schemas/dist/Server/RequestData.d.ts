import { ExtractSchemaResultType } from 'vts';
export declare const SchemaSessionUserData: import("vts").ObjectSchema<{
    isLogin: import("vts").BooleanSchema;
    userid: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    role: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
}>;
export type SessionUserData = ExtractSchemaResultType<typeof SchemaSessionUserData>;
export declare const SchemaSessionData: import("vts").ObjectSchema<{
    id: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    user: import("vts").ObjectSchema<{
        isLogin: import("vts").BooleanSchema;
        userid: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        role: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    }>;
}>;
export type SessionData = ExtractSchemaResultType<typeof SchemaSessionData>;
export declare const SchemaRequestData: import("vts").ObjectSchema<{
    session: import("vts").ObjectSchema<{
        id: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        user: import("vts").ObjectSchema<{
            isLogin: import("vts").BooleanSchema;
            userid: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            role: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        }>;
    }>;
}>;
export type RequestData = ExtractSchemaResultType<typeof SchemaRequestData>;
