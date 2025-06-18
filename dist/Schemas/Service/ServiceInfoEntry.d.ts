import { ExtractSchemaResultType } from 'vts';
export declare const SchemaServiceInfoEntry: import("vts").ObjectSchema<{
    type: import("vts").NumberSchema;
    name: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    status: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    statusMsg: import("vts").StringSchema<import("vts").StringSchemaOptions>;
    importance: import("vts").NumberSchema;
    inProcess: import("vts").BooleanSchema;
    dependencies: import("vts").ArraySchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
}>;
export type ServiceInfoEntry = ExtractSchemaResultType<typeof SchemaServiceInfoEntry>;
