import { ExtractSchemaResultType } from 'vts';
export declare enum ENV_DUTY_DB {
    DB_MYSQL_USERNAME = "DB_MYSQL_USERNAME",
    DB_MYSQL_PASSWORD = "DB_MYSQL_PASSWORD",
    DB_MYSQL_DATABASE = "DB_MYSQL_DATABASE"
}
export declare enum ENV_OPTIONAL_DB {
    DB_MYSQL_HOST = "DB_MYSQL_HOST",
    DB_MYSQL_PORT = "DB_MYSQL_PORT",
    DB_INFLUX_URL = "DB_INFLUX_URL",
    DB_INFLUX_TOKEN = "DB_INFLUX_TOKEN",
    DB_INFLUX_ORG = "DB_INFLUX_ORG",
    DB_INFLUX_BUCKET = "DB_INFLUX_BUCKET",
    DB_REDIS_URL = "DB_REDIS_URL",
    DB_REDIS_PASSWORD = "DB_REDIS_PASSWORD"
}
export declare const SchemaConfigDbOptionsMySql: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    host: import("vts/dist/schemas/stringSchema.js").StringSchema;
    port: import("vts/dist/schemas/numberSchema.js").NumberSchema;
    username: import("vts/dist/schemas/stringSchema.js").StringSchema;
    password: import("vts/dist/schemas/stringSchema.js").StringSchema;
    database: import("vts/dist/schemas/stringSchema.js").StringSchema;
}>;
export declare const SchemaConfigDbOptionsInflux: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    url: import("vts/dist/schemas/stringSchema.js").StringSchema;
    token: import("vts/dist/schemas/stringSchema.js").StringSchema;
    org: import("vts/dist/schemas/stringSchema.js").StringSchema;
    bucket: import("vts/dist/schemas/stringSchema.js").StringSchema;
    username: import("vts/dist/schemas/stringSchema.js").StringSchema;
    password: import("vts/dist/schemas/stringSchema.js").StringSchema;
}>;
export declare const SchemaConfigDbOptionsRedis: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    url: import("vts/dist/schemas/stringSchema.js").StringSchema;
    password: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
}>;
export declare const SchemaConfigDbOptions: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
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
export type ConfigDbOptions = ExtractSchemaResultType<typeof SchemaConfigDbOptions>;
