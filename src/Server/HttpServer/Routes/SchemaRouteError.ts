import {Schema, SchemaErrors} from 'vts';
import {VtsSchemaError} from '../../../VtsExtend/VtsSchemaError.js';

/**
 * Schema route error
 */
export class SchemaRouteError<T> extends VtsSchemaError<T> {

    /**
     * Description name
     * @protected
     */
    protected _descriptionName: string;

    /**
     * Constructor
     * @param {Schema<T>} schema
     * @param {unknown} value
     * @param {SchemaErrors} error
     * @param {string} descriptionName
     */
    public constructor(schema: Schema<T>, value: unknown, error: SchemaErrors, descriptionName: string) {
        super(schema, value, error);

        this._descriptionName = descriptionName;
    }

    /**
     * To a string
     * @return {string}
     */
    public toString(): string {
        let str = `DescriptionSchema: ${this._descriptionName} - `;
        str += super.toString();

        return str;
    }

}