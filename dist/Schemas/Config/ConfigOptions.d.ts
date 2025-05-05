import { ExtractSchemaResultType } from 'vts';
export declare const SchemaConfigOptions: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    logging: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        dirname: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        filename: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        zippedArchive: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/booleanSchema.js").BooleanSchema>;
        maxSize: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        maxFiles: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        enableConsole: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/booleanSchema.js").BooleanSchema>;
        level: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
    }>>;
}>;
export type ConfigOptions = ExtractSchemaResultType<typeof SchemaConfigOptions>;
