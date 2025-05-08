import { ExtractSchemaResultType } from 'vts';
export declare const SchemaDefaultArgs: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    config: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
} & {
    envargs: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
}>;
export type DefaultArgs = ExtractSchemaResultType<typeof SchemaDefaultArgs>;
