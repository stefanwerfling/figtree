import {ExtractSchemaResultType, Vts} from 'vts';
import {StatusCodes} from './StatusCodes.js';

/**
 * Schema for default return
 */
export const SchemaDefaultReturn = Vts.object({
    statusCode: Vts.or([
        Vts.enum(StatusCodes, {description: 'Return the status code from json response.'}),
        Vts.string({description: 'Return the status code from json response.'})
    ]),
    msg: Vts.optional(Vts.string({description: 'Optional string message, is only set by a error code.'}))
}, {description: 'Default response from server.'});

/**
 * Type of schema for default return
 */
export type DefaultReturn = ExtractSchemaResultType<typeof SchemaDefaultReturn>;