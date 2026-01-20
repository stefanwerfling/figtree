import { ExtractSchemaResultType } from 'vts';
export declare const SchemaServiceStatusResponse: import("vts").ObjectSchema<{
    statusCode: import("vts").OrSchema<import("vts").StringSchema<import("vts").StringSchemaOptions> | import("vts").EnumSchema<import("./StatusCodes.js").StatusCodes>>;
    msg: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
} & {
    services: import("vts").ArraySchema<import("vts").ObjectSchema<{
        type: import("vts").NumberSchema;
        name: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        status: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        statusMsg: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        importance: import("vts").NumberSchema;
        inProcess: import("vts").BooleanSchema;
        dependencies: import("vts").ArraySchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    }>>;
}>;
export type ServiceStatusResponse = ExtractSchemaResultType<typeof SchemaServiceStatusResponse>;
export declare const SchemaServiceByNameRequest: import("vts").ObjectSchema<{
    name: import("vts").StringSchema<import("vts").StringSchemaOptions>;
}>;
export type ServiceByNameRequest = ExtractSchemaResultType<typeof SchemaServiceByNameRequest>;
