import { ExtractSchemaResultType } from 'vts';
export declare const SchemaConfigBackendOptions: import("vts").ObjectSchema<{
    logging: import("vts").OptionalSchema<import("vts").ObjectSchema<{
        dirname: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        filename: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        zippedArchive: import("vts").OptionalSchema<import("vts").BooleanSchema>;
        maxSize: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        maxFiles: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        enableConsole: import("vts").OptionalSchema<import("vts").BooleanSchema>;
        level: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    }>>;
} & {
    db: import("vts").ObjectSchema<{
        mysql: import("vts").OptionalSchema<import("vts").ObjectSchema<{
            host: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            port: import("vts").NumberSchema;
            username: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            password: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            database: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        }>>;
        influx: import("vts").OptionalSchema<import("vts").ObjectSchema<{
            url: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            token: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            org: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            bucket: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            username: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            password: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        }>>;
        redis: import("vts").OptionalSchema<import("vts").ObjectSchema<{
            url: import("vts").StringSchema<import("vts").StringSchemaOptions>;
            password: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        }>>;
        chroma: import("vts").OptionalSchema<import("vts").ObjectSchema<{
            url: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        }>>;
    }>;
    httpserver: import("vts").ObjectSchema<{
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
}>;
export type ConfigBackendOptions = ExtractSchemaResultType<typeof SchemaConfigBackendOptions>;
