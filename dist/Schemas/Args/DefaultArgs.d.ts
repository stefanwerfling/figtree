import { ExtractSchemaResultType } from 'vts';
export declare const SchemaDefaultArgs: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    config: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
} & {
    envargs: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
}>;
export type DefaultArgs = ExtractSchemaResultType<typeof SchemaDefaultArgs>;
