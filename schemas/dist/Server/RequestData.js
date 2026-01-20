import { Vts } from 'vts';
export const SchemaSessionUserData = Vts.object({
    isLogin: Vts.boolean(),
    userid: Vts.string(),
    role: Vts.optional(Vts.string()),
}, {
    description: '',
});
export const SchemaSessionData = Vts.object({
    id: Vts.string(),
    user: SchemaSessionUserData,
}, {
    description: '',
    objectSchema: {
        ignoreAdditionalItems: true
    }
});
export const SchemaRequestData = Vts.object({
    session: SchemaSessionData,
}, {
    description: '',
    objectSchema: {
        ignoreAdditionalItems: true
    }
});
//# sourceMappingURL=RequestData.js.map