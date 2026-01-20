import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * Schema of SessionUserData
 */
export const SchemaSessionUserData = Vts.object({
    isLogin: Vts.boolean(),
    userid: Vts.string(),
    role: Vts.optional(Vts.string()),
}, {
    description: '',
});

/**
 * Type of schema SessionUserData
 */
export type SessionUserData = ExtractSchemaResultType<typeof SchemaSessionUserData>;

/**
 * Schema of SessionData
 */
export const SchemaSessionData = Vts.object({
    id: Vts.string(),
    user: SchemaSessionUserData,
}, {
    description: '',
    objectSchema: {
        ignoreAdditionalItems: true
    }
});

/**
 * Type of schema SessionData
 */
export type SessionData = ExtractSchemaResultType<typeof SchemaSessionData>;

/**
 * Schema of RequestData
 */
export const SchemaRequestData = Vts.object({
    session: SchemaSessionData,
}, {
    description: '',
    objectSchema: {
        ignoreAdditionalItems: true
    }
});

/**
 * Type of schema RequestData
 */
export type RequestData = ExtractSchemaResultType<typeof SchemaRequestData>;