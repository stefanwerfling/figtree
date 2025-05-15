import { Schema } from 'vts';
export type SchemaHelperSwaggerIn = 'query' | 'path' | 'header' | 'cookie';
export type SchemaHelperSwaggerReturnParam = {
    name: string;
    in: SchemaHelperSwaggerIn;
    required: boolean;
    description: string;
    schema: {
        type: string;
    };
};
export declare class SchemaHelper {
    protected static _convertType(descript: object): object;
    protected static _convertOr(descript: object): object;
    protected static _convertEnum(descript: object): object;
    protected static _convertObject(descript: object): object;
    static _convertByType(descript: object): object | null;
    static convertSchemaToSwagger<T>(schema: Schema<T>): any;
    static convertSchemaToSwaggerResponse<T>(statusCode: string, schema: Schema<T>): any;
    static convertSchemaToSwaggerRequest<T>(schema: Schema<T>): any;
    static convertSchemaToSwaggerParameter<T>(instr: SchemaHelperSwaggerIn, schema: Schema<T>): SchemaHelperSwaggerReturnParam[];
}
