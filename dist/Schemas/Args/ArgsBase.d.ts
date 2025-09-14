import { ExtractSchemaResultType } from 'vts';
export declare const SchemaArgsBase: import("vts").ObjectSchema<{
    config: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
}>;
export type ArgsBase = ExtractSchemaResultType<typeof SchemaArgsBase>;
