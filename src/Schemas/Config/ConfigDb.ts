import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * ENV_DUTY_DB
 */
export enum ENV_DUTY_DB {
    DB_MYSQL_USERNAME = 'DB_MYSQL_USERNAME',
    DB_MYSQL_PASSWORD = 'DB_MYSQL_PASSWORD',
    DB_MYSQL_DATABASE = 'DB_MYSQL_DATABASE'
}

/**
 * ENV_OPTIONAL_DB
 */
export enum ENV_OPTIONAL_DB {
    DB_MYSQL_HOST = 'DB_MYSQL_HOST',
    DB_MYSQL_PORT = 'DB_MYSQL_PORT',
    DB_INFLUX_URL = 'DB_INFLUX_URL',
    DB_INFLUX_TOKEN = 'DB_INFLUX_TOKEN',
    DB_INFLUX_ORG = 'DB_INFLUX_ORG',
    DB_INFLUX_BUCKET = 'DB_INFLUX_BUCKET',
    DB_REDIS_URL = 'DB_REDIS_URL',
    DB_REDIS_PASSWORD = 'DB_REDIS_PASSWORD'
}

/**
 * Schema for Mysql DB options config
 */
export const SchemaConfigDbOptionsMySql = Vts.object({
    host: Vts.string(),
    port: Vts.number(),
    username: Vts.string(),
    password: Vts.string(),
    database: Vts.string()
});

/**
 * Schema for Influx DB options config
 */
export const SchemaConfigDbOptionsInflux = Vts.object({
    url: Vts.string(),
    token: Vts.string(),
    org: Vts.string(),
    bucket: Vts.string(),
    username: Vts.string(),
    password: Vts.string()
});

/**
 * Schema for Redis DB options config
 */
export const SchemaConfigDbOptionsRedis = Vts.object({
    url: Vts.string(),
    password: Vts.optional(Vts.string())
});

/**
 * Schema for chroma DB options config
 */
export const SchemaConfigDbOptionsChroma = Vts.object({
    url: Vts.string()
});

/**
 * Schema DB options config
 */
export const SchemaConfigDbOptions = Vts.object({
    mysql: SchemaConfigDbOptionsMySql,
    influx: Vts.optional(SchemaConfigDbOptionsInflux),
    redis: Vts.optional(SchemaConfigDbOptionsRedis),
    chroma: Vts.optional(SchemaConfigDbOptionsChroma)
});

/**
 * Type of DB options config
 */
export type ConfigDbOptions = ExtractSchemaResultType<typeof SchemaConfigDbOptions>;