import { Vts } from 'vts';
export const SchemaConfigHttpServerSession = Vts.object({
    secret: Vts.optional(Vts.string()),
    cookie_path: Vts.optional(Vts.string()),
    cookie_max_age: Vts.optional(Vts.number()),
}, {
    description: '',
});
export const SchemaConfigHttpServerProxy = Vts.object({
    trust: Vts.or([Vts.string(), Vts.boolean(), Vts.array(Vts.string())]),
}, {
    description: '',
});
export const SchemaConfigHttpServerCsrf = Vts.object({
    cookie: Vts.boolean(),
}, {
    description: '',
});
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
//# sourceMappingURL=ConfigHttpServer.js.map