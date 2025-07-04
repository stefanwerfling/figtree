import { ExtractSchemaResultType } from 'vts';
import { StatusCodes } from './StatusCodes.js';
export declare const SchemaDefaultReturn: import("vts").ObjectSchema<{
    statusCode: import("vts").OrSchema<import("vts").EnumSchema<StatusCodes> | import("vts").StringSchema<import("vts").StringSchemaOptions>>;
    msg: import("vts").OptionalSchema<import("vts").StringSchema<import("vts").StringSchemaOptions>>;
}>;
export type DefaultReturn = ExtractSchemaResultType<typeof SchemaDefaultReturn>;
