import { Vts } from 'vts';
import { SchemaDefaultReturn } from '../../../../Schemas/Server/Routes/DefaultReturn.js';
export const SchemaIsLogin = SchemaDefaultReturn.extend({
    status: Vts.boolean({ description: 'Status is the user login' })
});
//# sourceMappingURL=Login.js.map