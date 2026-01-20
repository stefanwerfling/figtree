import { ExtractSchemaResultType } from 'vts';
export declare const SchemaTest: import("vts").ObjectSchema<{
    test: import("vts").OrSchema<import("vts").StringSchema<import("vts").StringSchemaOptions> | import("vts").ObjectSchema<{
        test1: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        test2: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    }>>;
}>;
export declare const SchemaIsLogin: import("vts").ObjectSchema<{
    statusCode: import("vts").OrSchema<import("vts").StringSchema<import("vts").StringSchemaOptions> | import("vts").EnumSchema<import("figtree-schemas").StatusCodes>>;
    msg: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
} & {
    status: import("vts").BooleanSchema;
    more: import("vts").OptionalSchema<import("vts").ObjectSchema<{
        test: import("vts").OrSchema<import("vts").StringSchema<import("vts").StringSchemaOptions> | import("vts").ObjectSchema<{
            test1: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            test2: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        }>>;
    }>>;
}>;
export type IsLogin = ExtractSchemaResultType<typeof SchemaIsLogin>;
export declare const SchemaIsLoginParameter: import("vts").ObjectSchema<{
    username: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    userid: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
}>;
export type IsLoginParameter = ExtractSchemaResultType<typeof SchemaIsLoginParameter>;
export declare const SchemaIsLoginParameterPath: import("vts").ObjectSchema<{
    userid: import("vts").StringSchema<import("vts").StringSchemaOptions>;
}>;
export declare const SchemaLoginRequest: import("vts").ObjectSchema<{
    username: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    password: import("vts").StringSchema<import("vts").StringSchemaOptions>;
}>;
export type LoginRequest = ExtractSchemaResultType<typeof SchemaLoginRequest>;
