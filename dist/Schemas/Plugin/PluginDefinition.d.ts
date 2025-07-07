import { ExtractSchemaResultType } from 'vts';
export declare const SchemaPluginDefinition: import("vts").ObjectSchema<{
    name: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    description: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    version: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    author: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    url: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    main: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    main_directory: import("vts").OptionalSchema<import("vts").ArraySchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>>;
    distHash: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
}>;
export type PluginDefinition = ExtractSchemaResultType<typeof SchemaPluginDefinition>;
