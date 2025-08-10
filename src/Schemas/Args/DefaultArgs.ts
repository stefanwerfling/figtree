import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaArgsBase} from './ArgsBase.js';

/**
 * Schema of DefaultArgs
 */
export const SchemaDefaultArgs = SchemaArgsBase.extend({
    envargs: Vts.optional(Vts.string()),
}, {
    description: '',
});

/**
 * Type of schema DefaultArgs
 */
export type DefaultArgs = ExtractSchemaResultType<typeof SchemaDefaultArgs>;