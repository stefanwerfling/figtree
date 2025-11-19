import {Schema, SchemaErrors} from 'vts';
import {VtsSchemaError} from './VtsSchemaError.js';

/**
 * Vts schema validate
 */
export class VtsSchemaValidate {

    /**
     * Validate execpt
     * @param {Schema<T>} schema
     * @param {unknown} data
     * @return boolean
     */
    public static validateExcept<T>(schema: Schema<T>, data: unknown): boolean {
        const errors: SchemaErrors = [];

        if (schema.validate(data, errors)) {
            return true;
        }

        throw new VtsSchemaError(schema, data, errors);
    }

}