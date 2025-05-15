import { ExtractSchemaResultType } from 'vts';
export declare const SchemaTest: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    test: import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions> | import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        test1: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        test2: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    }>>;
}>;
export declare const SchemaIsLogin: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    statusCode: import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/enumSchema.js").EnumSchema<import("../../../../index.js").StatusCodes> | import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
    msg: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
} & {
    status: import("vts/dist/schemas/booleanSchema.js").BooleanSchema;
    more: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        test: import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions> | import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
            test1: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
            test2: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        }>>;
    }>>;
}>;
export type IsLogin = ExtractSchemaResultType<typeof SchemaIsLogin>;
export declare const SchemaIsLoginParameter: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    username: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
    userid: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
}>;
export type IsLoginParameter = ExtractSchemaResultType<typeof SchemaIsLoginParameter>;
export declare const SchemaIsLoginParameterPath: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    userid: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
}>;
