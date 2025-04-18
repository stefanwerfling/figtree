export declare const SchemaConfigHttpServerSession: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    secret: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
    cookie_path: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
    cookie_max_age: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema>;
}>;
export declare const SchemaConfigHttpServer: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    port: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema>;
    publicdir: import("vts/dist/schemas/stringSchema.js").StringSchema;
    session: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
        secret: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        cookie_path: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
        cookie_max_age: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema>;
    }>>;
    sslpath: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
}>;
