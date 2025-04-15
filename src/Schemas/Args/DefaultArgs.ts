import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaArgsBase} from './ArgsBase.js';

/**
 * Schema for default args
 */
export const SchemaDefaultArgs = SchemaArgsBase.extend({
    envargs: Vts.optional(Vts.string())
});

/**
 * Type of schema for default args
 */
export type DefaultArgs = ExtractSchemaResultType<typeof SchemaDefaultArgs>;