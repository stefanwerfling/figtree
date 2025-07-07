import { Vts } from 'vts';
export const SchemaSessionUserData = Vts.object({
    isLogin: Vts.boolean(),
    userid: Vts.string(),
    role: Vts.optional(Vts.string())
});
export const SchemaSessionData = Vts.object({
    id: Vts.string(),
    user: Vts.optional(SchemaSessionUserData)
}, {
    objectSchema: {
        ignoreAdditionalItems: true
    }
});
export const SchemaRequestData = Vts.object({
    session: SchemaSessionData
}, {
    objectSchema: {
        ignoreAdditionalItems: true
    }
});
//# sourceMappingURL=RequestData.js.map