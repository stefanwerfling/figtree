import { ExtractSchemaResultType } from 'vts';
export declare const SchemaProviderEntry: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    name: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    title: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
}>;
export type ProviderEntry = ExtractSchemaResultType<typeof SchemaProviderEntry>;
