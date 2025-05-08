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
    host: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    port: import("vts/dist/schemas/numberSchema.js").NumberSchema;
    username: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    password: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    database: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
}>;
export declare const SchemaConfigDbOptionsInflux: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    url: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    token: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    org: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    bucket: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    username: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    password: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
}>;
export declare const SchemaConfigDbOptionsRedis: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    url: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    password: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
}>;
export declare const SchemaConfigDbOptions: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    mysql: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        host: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        port: import("vts/dist/schemas/numberSchema.js").NumberSchema;
        username: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        password: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        database: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    }>;
    influx: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        url: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        token: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        org: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        bucket: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        username: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        password: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    }>>;
    redis: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        url: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
        password: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
    }>>;
}>;
export type ConfigDbOptions = ExtractSchemaResultType<typeof SchemaConfigDbOptions>;
