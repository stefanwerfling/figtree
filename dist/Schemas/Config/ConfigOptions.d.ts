import { ExtractSchemaResultType } from 'vts';
export declare const SchemaConfigOptions: import("vts").ObjectSchema<{
    logging: import("vts").OptionalSchema<import("vts").ObjectSchema<{
        dirname: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        filename: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        zippedArchive: import("vts").OptionalSchema<import("vts").BooleanSchema>;
        maxSize: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        maxFiles: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
        enableConsole: import("vts").OptionalSchema<import("vts").BooleanSchema>;
        level: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    }>>;
}>;
export type ConfigOptions = ExtractSchemaResultType<typeof SchemaConfigOptions>;
