import { Vts } from 'vts';
export const SchemaConfigHttpServerSession = Vts.object({
    secret: Vts.optional(Vts.string()),
    cookie_path: Vts.optional(Vts.string()),
    cookie_max_age: Vts.optional(Vts.number())
});
export const SchemaConfigHttpServer = Vts.object({
    port: Vts.optional(Vts.number()),
    publicdir: Vts.string(),
    session: Vts.optional(SchemaConfigHttpServerSession),
    sslpath: Vts.optional(Vts.string())
});
//# sourceMappingURL=ConfigHttpServer.js.map