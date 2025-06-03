import { ExtractSchemaResultType } from 'vts';
export declare const SchemaServiceStatusResponse: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    statusCode: import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/enumSchema.js").EnumSchema<import("./StatusCodes.js").StatusCodes> | import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
    msg: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
} & {
    services: import("vts/dist/schemas/arraySchema.js").ArraySchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        type: import("vts/dist/schemas/numberSchema.js").NumberSchema;
        name: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        status: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        statusMsg: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        importance: import("vts/dist/schemas/numberSchema.js").NumberSchema;
        inProcess: import("vts/dist/schemas/booleanSchema.js").BooleanSchema;
        dependencies: import("vts/dist/schemas/arraySchema.js").ArraySchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
    }>>;
}>;
export type ServiceStatusResponse = ExtractSchemaResultType<typeof SchemaServiceStatusResponse>;
export declare const SchemaServiceByNameRequest: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    name: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
}>;
export type ServiceByNameRequest = ExtractSchemaResultType<typeof SchemaServiceByNameRequest>;
