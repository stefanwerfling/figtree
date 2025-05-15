import { Vts } from 'vts';
import { SchemaDefaultReturn } from '../../../../Schemas/Server/Routes/DefaultReturn.js';
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
//# sourceMappingURL=Login.js.map