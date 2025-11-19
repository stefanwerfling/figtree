import { Schema, SchemaErrors } from 'vts';
import { VtsSchemaError } from '../../../VtsExtend/VtsSchemaError.js';
export declare class SchemaRouteError<T> extends VtsSchemaError<T> {
    protected _descriptionName: string;
    constructor(schema: Schema<T>, value: unknown, error: SchemaErrors, descriptionName: string);
    toString(): string;
}
