import { ExtractSchemaResultType } from 'vts';
export declare const SchemaIsLogin: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    statusCode: import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema | import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/equalSchema.js").EqualSchema<string | import("../../../../index.js").StatusCodes>>>;
    msg: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
} & {
    status: import("vts/dist/schemas/booleanSchema.js").BooleanSchema;
}>;
export type IsLogin = ExtractSchemaResultType<typeof SchemaIsLogin>;
