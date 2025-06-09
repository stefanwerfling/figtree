import {Vts} from 'vts';

/**
 * Schema Config Http server session
 */
export const SchemaConfigHttpServerSession = Vts.object({
    secret: Vts.optional(Vts.string()),
    cookie_path: Vts.optional(Vts.string()),
    cookie_max_age: Vts.optional(Vts.number())
});

/**
 * Schema Config Http server proxy
 */
export const SchemaConfigHttpServerProxy = Vts.object({
    trust: Vts.or([
        Vts.string(),
        Vts.boolean(),
        Vts.array(Vts.string())
    ])
});

/**
 * Schema config http server csrf
 */
export const SchemaConfigHttpServerCsrf = Vts.object({
    cookie: Vts.boolean()
});

/**
 * Schema config http server
 */
export const SchemaConfigHttpServer = Vts.object({
    port: Vts.optional(Vts.number()),
    publicdir: Vts.string(),
    session: Vts.optional(SchemaConfigHttpServerSession),
    sslpath: Vts.optional(Vts.string()),
    proxy: Vts.optional(SchemaConfigHttpServerProxy),
    csrf: Vts.optional(SchemaConfigHttpServerCsrf)
});