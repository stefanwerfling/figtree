import { ExtractSchemaResultType } from 'vts';
export declare const SchemaServiceInfoEntry: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    type: import("vts/dist/schemas/numberSchema.js").NumberSchema;
    name: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    status: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    statusMsg: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    importance: import("vts/dist/schemas/numberSchema.js").NumberSchema;
    inProcess: import("vts/dist/schemas/booleanSchema.js").BooleanSchema;
    dependencies: import("vts/dist/schemas/arraySchema.js").ArraySchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
}>;
export type ServiceInfoEntry = ExtractSchemaResultType<typeof SchemaServiceInfoEntry>;
