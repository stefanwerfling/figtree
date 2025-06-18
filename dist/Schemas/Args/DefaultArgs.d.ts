import { ExtractSchemaResultType } from 'vts';
export declare const SchemaDefaultArgs: import("vts").ObjectSchema<{
    config: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
} & {
    envargs: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
}>;
export type DefaultArgs = ExtractSchemaResultType<typeof SchemaDefaultArgs>;
