import { ExtractSchemaResultType } from 'vts';
export declare const SchemaProviderEntry: import("vts").ObjectSchema<{
    name: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    title: import("vts").StringSchema<import("vts").StringSchemaOptions>;
}>;
export type ProviderEntry = ExtractSchemaResultType<typeof SchemaProviderEntry>;
