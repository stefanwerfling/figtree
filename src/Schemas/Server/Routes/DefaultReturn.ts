import {ExtractSchemaResultType, Vts} from 'vts';
import {StatusCodes} from './StatusCodes.js';

/**
 * Schema for default return
 */
export const SchemaDefaultReturn = Vts.object({
    statusCode: Vts.or([Vts.enum(StatusCodes), Vts.number()]),
    msg: Vts.optional(Vts.string())
});

/**
 * Type of schema for default return
 */
export type DefaultReturn = ExtractSchemaResultType<typeof SchemaDefaultReturn>;