import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaDefaultReturn} from '../../../../Schemas/Server/Routes/DefaultReturn.js';

/**
 * IsLogin
 */
export const SchemaIsLogin = SchemaDefaultReturn.extend({
    status: Vts.boolean({description: 'Status is the user login'})
});

/**
 * IsLogin
 */
export type IsLogin = ExtractSchemaResultType<typeof SchemaIsLogin>;