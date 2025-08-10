import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * Schema of ConfigHttpServerSession
 */
export const SchemaConfigHttpServerSession = Vts.object({
    secret: Vts.optional(Vts.string()),
    cookie_path: Vts.optional(Vts.string()),
    cookie_max_age: Vts.optional(Vts.number()),
}, {
    description: '',
});

/**
 * Type of schema ConfigHttpServerSession
 */
export type ConfigHttpServerSession = ExtractSchemaResultType<typeof SchemaConfigHttpServerSession>;

/**
 * Schema of ConfigHttpServerProxy
 */
export const SchemaConfigHttpServerProxy = Vts.object({
    trust: Vts.or([Vts.string(), Vts.boolean(), Vts.array(Vts.string())]),
}, {
    description: '',
});

/**
 * Type of schema ConfigHttpServerProxy
 */
export type ConfigHttpServerProxy = ExtractSchemaResultType<typeof SchemaConfigHttpServerProxy>;

/**
 * Schema of ConfigHttpServerCsrf
 */
export const SchemaConfigHttpServerCsrf = Vts.object({
    cookie: Vts.boolean(),
}, {
    description: '',
});

/**
 * Type of schema ConfigHttpServerCsrf
 */
export type ConfigHttpServerCsrf = ExtractSchemaResultType<typeof SchemaConfigHttpServerCsrf>;

/**
 * Schema of ConfigHttpServer
 */
export const SchemaConfigHttpServer = Vts.object({
    port: Vts.optional(Vts.number()),
    publicdir: Vts.string(),
    session: Vts.optional(SchemaConfigHttpServerSession),
    sslpath: Vts.optional(Vts.string()),
    proxy: Vts.optional(SchemaConfigHttpServerProxy),
    csrf: Vts.optional(SchemaConfigHttpServerCsrf),
}, {
    description: '',
});

/**
 * Type of schema ConfigHttpServer
 */
export type ConfigHttpServer = ExtractSchemaResultType<typeof SchemaConfigHttpServer>;