import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * Schema for session user data
 */
export const SchemaSessionUserData = Vts.object({
    isLogin: Vts.boolean(),
    userid: Vts.string()
});

/**
 * Type of schema for session user data
 */
export type SessionUserData = ExtractSchemaResultType<typeof SchemaSessionUserData>;

/**
 * Schema for session data
 */
export const SchemaSessionData = Vts.object({
    id: Vts.string(),
    user: Vts.optional(SchemaSessionUserData)
}, {
    objectSchema: {
        ignoreAdditionalItems: true
    }
});

/**
 * Type of schema for session data
 */
export type SessionData = ExtractSchemaResultType<typeof SchemaSessionData>;

/**
 * Schema for request data
 */
export const SchemaRequestData = Vts.object({
    session: SchemaSessionData
}, {
    objectSchema: {
        ignoreAdditionalItems: true
    }
});

/**
 * Type of schema for request data
 */
export type RequestData = ExtractSchemaResultType<typeof SchemaRequestData>;