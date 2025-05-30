export declare const SchemaConfigHttpServerSession: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    secret: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
    cookie_path: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
    cookie_max_age: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema>;
}>;
export declare const SchemaConfigHttpServerProxy: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    trust: import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions> | import("vts/dist/schemas/arraySchema.js").ArraySchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>> | import("vts/dist/schemas/booleanSchema.js").BooleanSchema>;
}>;
export declare const SchemaConfigHttpServer: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    port: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema>;
    publicdir: import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>;
    session: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        secret: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
        cookie_path: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
        cookie_max_age: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema>;
    }>>;
    sslpath: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>>;
    proxy: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        trust: import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions> | import("vts/dist/schemas/arraySchema.js").ArraySchema<import("vts/dist/schemas/stringSchema.js").StringSchema<import("vts/dist/schemas/stringSchema.js").StringSchemaOptions>> | import("vts/dist/schemas/booleanSchema.js").BooleanSchema>;
    }>>;
}>;
