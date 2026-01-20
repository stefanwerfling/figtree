import { SchemaDefaultReturn } from 'figtree_schemas';
import { Vts } from 'vts';
export const SchemaTest = Vts.object({
    test: Vts.or([
        Vts.object({
            test1: Vts.string(),
            test2: Vts.string()
        }),
        Vts.string()
    ])
});
export const SchemaIsLogin = SchemaDefaultReturn.extend({
    status: Vts.boolean({ description: 'Status is the user login' }),
    more: Vts.optional(SchemaTest)
});
export const SchemaIsLoginParameter = Vts.object({
    username: Vts.optional(Vts.string()),
    userid: Vts.optional(Vts.string())
});
export const SchemaIsLoginParameterPath = Vts.object({
    userid: Vts.string({ description: 'Userid for request' })
});
export const SchemaLoginRequest = Vts.object({
    username: Vts.string(),
    password: Vts.string()
});
//# sourceMappingURL=Login.js.map