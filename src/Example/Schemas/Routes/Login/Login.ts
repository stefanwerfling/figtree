import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaDefaultReturn} from '../../../../Schemas/Server/Routes/DefaultReturn.js';

export const SchemaTest = Vts.object({
   test: Vts.or([
       Vts.object({
           test1: Vts.string(),
           test2: Vts.string()
       }),
       Vts.string()
   ])
});

/**
 * IsLogin
 */
export const SchemaIsLogin = SchemaDefaultReturn.extend({
    status: Vts.boolean({description: 'Status is the user login'}),
    more: Vts.optional(SchemaTest)
});

/**
 * IsLogin
 */
export type IsLogin = ExtractSchemaResultType<typeof SchemaIsLogin>;


export const SchemaIsLoginParameter = Vts.object({
    username: Vts.optional(Vts.string()),
    userid: Vts.optional(Vts.string())
});

export type IsLoginParameter = ExtractSchemaResultType<typeof SchemaIsLoginParameter>;

export const SchemaIsLoginParameterPath = Vts.object({
    userid: Vts.string({description: 'Userid for request'})
});

export const SchemaLoginRequest = Vts.object({
    username: Vts.string(),
    password: Vts.string()
});

export type LoginRequest = ExtractSchemaResultType<typeof SchemaLoginRequest>;