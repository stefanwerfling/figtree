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
export declare const SchemaConfigDbOptionsMySql: import("vts").ObjectSchema<{
    host: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    port: import("vts").NumberSchema;
    username: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    password: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    database: import("vts").StringSchema<import("vts").StringSchemaOptions>;
}>;
export declare const SchemaConfigDbOptionsInflux: import("vts").ObjectSchema<{
    url: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    token: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    org: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    bucket: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    username: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    password: import("vts").StringSchema<import("vts").StringSchemaOptions>;
}>;
export declare const SchemaConfigDbOptionsRedis: import("vts").ObjectSchema<{
    url: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    password: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
}>;
export declare const SchemaConfigDbOptionsChroma: import("vts").ObjectSchema<{
    url: import("vts").StringSchema<import("vts").StringSchemaOptions>;
}>;
export declare const SchemaConfigDbOptions: import("vts").ObjectSchema<{
    mysql: import("vts").ObjectSchema<{
        host: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        port: import("vts").NumberSchema;
        username: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        password: import("vts").StringSchema<import("vts").StringSchemaOptions>;
        database: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    }>;
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
export type ConfigDbOptions = ExtractSchemaResultType<typeof SchemaConfigDbOptions>;
