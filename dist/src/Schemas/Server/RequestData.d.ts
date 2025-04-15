import { ExtractSchemaResultType } from 'vts';
export declare const SchemaSessionUserData: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    isLogin: import("vts/dist/schemas/booleanSchema.js").BooleanSchema;
    userid: import("vts/dist/schemas/stringSchema.js").StringSchema;
}>;
export type SessionUserData = ExtractSchemaResultType<typeof SchemaSessionUserData>;
export declare const SchemaSessionData: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    id: import("vts/dist/schemas/stringSchema.js").StringSchema;
    user: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        isLogin: import("vts/dist/schemas/booleanSchema.js").BooleanSchema;
        userid: import("vts/dist/schemas/stringSchema.js").StringSchema;
    }>>;
}>;
export type SessionData = ExtractSchemaResultType<typeof SchemaSessionData>;
export declare const SchemaRequestData: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    session: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        id: import("vts/dist/schemas/stringSchema.js").StringSchema;
        user: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
            isLogin: import("vts/dist/schemas/booleanSchema.js").BooleanSchema;
            userid: import("vts/dist/schemas/stringSchema.js").StringSchema;
        }>>;
    }>;
}>;
export type RequestData = ExtractSchemaResultType<typeof SchemaRequestData>;
