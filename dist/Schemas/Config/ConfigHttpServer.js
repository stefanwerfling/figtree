import { Vts } from 'vts';
export const SchemaConfigHttpServerSession = Vts.object({
    secret: Vts.optional(Vts.string()),
    cookie_path: Vts.optional(Vts.string()),
    cookie_max_age: Vts.optional(Vts.number())
});
export const SchemaConfigHttpServerProxy = Vts.object({
    trust: Vts.or([
        Vts.string(),
        Vts.boolean(),
        Vts.array(Vts.string())
    ])
});
export const SchemaConfigHttpServer = Vts.object({
    port: Vts.optional(Vts.number()),
    publicdir: Vts.string(),
    session: Vts.optional(SchemaConfigHttpServerSession),
    sslpath: Vts.optional(Vts.string()),
    proxy: Vts.optional(SchemaConfigHttpServerProxy)
});
//# sourceMappingURL=ConfigHttpServer.js.map