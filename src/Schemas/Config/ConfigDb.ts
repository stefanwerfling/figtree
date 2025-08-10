import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * Enum ENV_DB
 */
export enum ENV_DB {
    'DB_MYSQL_HOST' = 'DB_MYSQL_HOST',
    'DB_MYSQL_PORT' = 'DB_MYSQL_PORT',
    'DB_MYSQL_USERNAME' = 'DB_MYSQL_USERNAME',
    'DB_MYSQL_PASSWORD' = 'DB_MYSQL_PASSWORD',
    'DB_MYSQL_DATABASE' = 'DB_MYSQL_DATABASE',
    'DB_INFLUX_URL' = 'DB_INFLUX_URL',
    'DB_INFLUX_TOKEN' = 'DB_INFLUX_TOKEN',
    'DB_INFLUX_ORG' = 'DB_INFLUX_ORG',
    'DB_INFLUX_BUCKET' = 'DB_INFLUX_BUCKET',
    'DB_REDIS_URL' = 'DB_REDIS_URL',
    'DB_REDIS_PASSWORD' = 'DB_REDIS_PASSWORD',
    'DB_CHROMA_URL' = 'DB_CHROMA_URL',
}

/**
 * Schema of ConfigDbOptionsMySql
 */
export const SchemaConfigDbOptionsMySql = Vts.object({
    host: Vts.string(),
    port: Vts.number(),
    username: Vts.string(),
    password: Vts.string(),
    database: Vts.string(),
}, {
    description: '',
});

/**
 * Type of schema ConfigDbOptionsMySql
 */
export type ConfigDbOptionsMySql = ExtractSchemaResultType<typeof SchemaConfigDbOptionsMySql>;

/**
 * Schema of ConfigDbOptionsInflux
 */
export const SchemaConfigDbOptionsInflux = Vts.object({
    url: Vts.string(),
    token: Vts.string(),
    org: Vts.string(),
    bucket: Vts.string(),
    username: Vts.string(),
    password: Vts.string(),
}, {
    description: '',
});

/**
 * Type of schema ConfigDbOptionsInflux
 */
export type ConfigDbOptionsInflux = ExtractSchemaResultType<typeof SchemaConfigDbOptionsInflux>;

/**
 * Schema of ConfigDbOptionsRedis
 */
export const SchemaConfigDbOptionsRedis = Vts.object({
    url: Vts.string(),
    password: Vts.optional(Vts.string()),
}, {
    description: '',
});

/**
 * Type of schema ConfigDbOptionsRedis
 */
export type ConfigDbOptionsRedis = ExtractSchemaResultType<typeof SchemaConfigDbOptionsRedis>;

/**
 * Schema of ConfigDbOptionsChroma
 */
export const SchemaConfigDbOptionsChroma = Vts.object({
    url: Vts.string(),
}, {
    description: '',
});

/**
 * Type of schema ConfigDbOptionsChroma
 */
export type ConfigDbOptionsChroma = ExtractSchemaResultType<typeof SchemaConfigDbOptionsChroma>;

/**
 * Schema of ConfigDbOptions
 */
export const SchemaConfigDbOptions = Vts.object({
    mysql: Vts.optional(SchemaConfigDbOptionsMySql),
    influx: Vts.optional(SchemaConfigDbOptionsInflux),
    redis: Vts.optional(SchemaConfigDbOptionsRedis),
    chroma: Vts.optional(SchemaConfigDbOptionsChroma),
}, {
    description: '',
});

/**
 * Type of schema ConfigDbOptions
 */
export type ConfigDbOptions = ExtractSchemaResultType<typeof SchemaConfigDbOptions>;