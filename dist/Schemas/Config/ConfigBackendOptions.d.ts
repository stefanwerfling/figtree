import { ExtractSchemaResultType } from 'vts';
export declare const SchemaConfigBackendOptions: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    logging: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        dirname: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        filename: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        zippedArchive: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/booleanSchema.js").BooleanSchema>;
        maxSize: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        maxFiles: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        enableConsole: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/booleanSchema.js").BooleanSchema>;
        level: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
    }>>;
} & {
    db: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        mysql: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
            host: import("vts/dist/schemas/stringSchema.js").StringSchema;
            port: import("vts/dist/schemas/numberSchema.js").NumberSchema;
            username: import("vts/dist/schemas/stringSchema.js").StringSchema;
            password: import("vts/dist/schemas/stringSchema.js").StringSchema;
            database: import("vts/dist/schemas/stringSchema.js").StringSchema;
        }>;
        influx: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
            url: import("vts/dist/schemas/stringSchema.js").StringSchema;
            token: import("vts/dist/schemas/stringSchema.js").StringSchema;
            org: import("vts/dist/schemas/stringSchema.js").StringSchema;
            bucket: import("vts/dist/schemas/stringSchema.js").StringSchema;
            username: import("vts/dist/schemas/stringSchema.js").StringSchema;
            password: import("vts/dist/schemas/stringSchema.js").StringSchema;
        }>>;
        redis: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
            url: import("vts/dist/schemas/stringSchema.js").StringSchema;
            password: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        }>>;
    }>;
    httpserver: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        port: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema>;
        publicdir: import("vts/dist/schemas/stringSchema.js").StringSchema;
        session: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
            secret: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
            cookie_path: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
            cookie_max_age: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema>;
        }>>;
        sslpath: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
    }>;
}>;
export type ConfigBackendOptions = ExtractSchemaResultType<typeof SchemaConfigBackendOptions>;
