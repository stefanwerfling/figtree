import { ExtractSchemaResultType } from 'vts';
export declare const SchemaConfigHttpServerSession: import("vts").ObjectSchema<{
    secret: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    cookie_path: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    cookie_max_age: import("vts").OptionalSchema<import("vts").NumberSchema>;
}>;
export type ConfigHttpServerSession = ExtractSchemaResultType<typeof SchemaConfigHttpServerSession>;
export declare const SchemaConfigHttpServerProxy: import("vts").ObjectSchema<{
    trust: import("vts").OrSchema<import("vts").StringSchema<import("vts").StringSchemaOptions> | import("vts").BooleanSchema | import("vts").ArraySchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>>;
}>;
export type ConfigHttpServerProxy = ExtractSchemaResultType<typeof SchemaConfigHttpServerProxy>;
export declare const SchemaConfigHttpServerCsrf: import("vts").ObjectSchema<{
    cookie: import("vts").BooleanSchema;
}>;
export type ConfigHttpServerCsrf = ExtractSchemaResultType<typeof SchemaConfigHttpServerCsrf>;
export declare const SchemaConfigHttpServer: import("vts").ObjectSchema<{
    port: import("vts").OptionalSchema<import("vts").NumberSchema>;
    publicdir: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    session: import("vts").OptionalSchema<import("vts").ObjectSchema<{
        secret: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        cookie_path: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        cookie_max_age: import("vts").OptionalSchema<import("vts").NumberSchema>;
    }>>;
    sslpath: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    proxy: import("vts").OptionalSchema<import("vts").ObjectSchema<{
        trust: import("vts").OrSchema<import("vts").StringSchema<import("vts").StringSchemaOptions> | import("vts").BooleanSchema | import("vts").ArraySchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>>;
    }>>;
    csrf: import("vts").OptionalSchema<import("vts").ObjectSchema<{
        cookie: import("vts").BooleanSchema;
    }>>;
}>;
export type ConfigHttpServer = ExtractSchemaResultType<typeof SchemaConfigHttpServer>;
