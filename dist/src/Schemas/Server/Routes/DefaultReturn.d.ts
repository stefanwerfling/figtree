import { ExtractSchemaResultType } from 'vts';
import { StatusCodes } from './StatusCodes.js';
export declare const SchemaDefaultReturn: import("vts/dist/schemas/objectSchema.js").ObjectSchema<{
    statusCode: import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/numberSchema.js").NumberSchema | import("vts/dist/schemas/orSchema.js").OrSchema<import("vts/dist/schemas/equalSchema.js").EqualSchema<string | StatusCodes>>>;
    msg: import("vts/dist/schemas/objectSchema/optionalSchema.js").OptionalSchema<import("vts/dist/schemas/stringSchema.js").StringSchema>;
}>;
export type DefaultReturn = ExtractSchemaResultType<typeof SchemaDefaultReturn>;
