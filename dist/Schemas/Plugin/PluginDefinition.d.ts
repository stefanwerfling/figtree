import { ExtractSchemaResultType } from 'vts';
export declare const SchemaPluginDefinition: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    name: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    description: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    version: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    author: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    url: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    main: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    main_directory: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/arraySchema.js").ArraySchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>>;
    distHash: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
}>;
export type PluginDefinition = ExtractSchemaResultType<typeof SchemaPluginDefinition>;
