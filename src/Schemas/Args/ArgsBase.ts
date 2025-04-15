import {Vts} from 'vts';

/**
 * Schema for Args base
 */
export const SchemaArgsBase = Vts.object({
    config: Vts.optional(Vts.string())
});