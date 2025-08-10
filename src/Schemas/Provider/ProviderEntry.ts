import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * Schema of ProviderEntry
 */
export const SchemaProviderEntry = Vts.object({
    name: Vts.string(),
    title: Vts.string(),
}, {
    description: '',
});

/**
 * Type of schema ProviderEntry
 */
export type ProviderEntry = ExtractSchemaResultType<typeof SchemaProviderEntry>;