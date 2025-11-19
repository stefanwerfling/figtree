import { Schema, SchemaErrors } from 'vts';
export declare class VtsSchemaError<T> extends Error {
    protected _schema: Schema<T>;
    protected _value: unknown;
    protected _serror: SchemaErrors;
    constructor(schema: Schema<T>, value: unknown, error: SchemaErrors);
    getSchema(): Schema<T>;
    getSchemaError(): SchemaErrors;
    protected _isSchema(obj: any): obj is Schema<any, any>;
    protected _formatErrorsWithSchema(schema: Schema<T> | undefined, value: any, serror: unknown, prefix?: string, depth?: number): string[];
    toString(): string;
}
