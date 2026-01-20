import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * Schema of ArgsBase
 */
export const SchemaArgsBase = Vts.object({
    config: Vts.optional(Vts.string({description: 'Config file with path'})),
}, {
    description: '',
});

/**
 * Type of schema ArgsBase
 */
export type ArgsBase = ExtractSchemaResultType<typeof SchemaArgsBase>;