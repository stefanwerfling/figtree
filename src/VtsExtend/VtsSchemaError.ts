import {ObjectSchema, Schema, SchemaErrors} from 'vts';

/**
 * Vts Schema error
 * @template T
 */
export class VtsSchemaError<T> extends Error {

    /**
     * Used Schema
     * @protected
     */
    protected _schema: Schema<T>;

    /**
     * Used Value
     * @protected
     */
    protected _value: unknown;

    /**
     * Schema errors
     * @protected
     */
    protected _serror: SchemaErrors;

    /**
     * Constructor
     * @param {Schema<T>} schema
     * @param {unknown} value
     * @param {SchemaErrors} error
     */
    public constructor(schema: Schema<T>, value: unknown, error: SchemaErrors) {
        super();

        this._schema = schema;
        this._value = value;
        this._serror = error;
    }

    /**
     * Return the used schema
     * @return {Schema<T>}
     */
    public getSchema(): Schema<T> {
        return this._schema;
    }

    /**
     * Return the error
     * @return {SchemaErrors}
     */
    public getSchemaError(): SchemaErrors {
        return this._serror;
    }

    /**
     * Is object a schema
     * @param {any} obj
     * @protected
     */
    protected _isSchema(obj: any): obj is Schema<any, any> {
        return obj instanceof Schema;
    }

    /**
     * Format errors with schema
     * @param {Schema<T> | undefined} schema
     * @param {any} value
     * @param {unknown} serror
     * @param {string} prefix
     * @param {number} depth
     * @protected
     */
    protected _formatErrorsWithSchema(
        schema: Schema<T> | undefined,
        value: any,
        serror: unknown,
        prefix: string = '',
        depth: number = 0
    ): string[] {
        const lines: string[] = [];
        const indent = '  '.repeat(depth);

        if (!serror || typeof serror !== 'object') {
            return lines;
        }

        const getTypeInfo = (val: any): string => {
            if (val === null) {
                return 'null';
            }

            if (Array.isArray(val)) {
                return 'array';
            }

            return typeof val;
        };

        const getDescription = (item: any): string => {
            if (item instanceof Schema) {
                return item.describe().description || '(no description)';
            }

            return '(no description)';
        };

        if (depth === 0 && schema) {
            lines.push(`${schema.constructor.name}`);
        }

        const schemaItems = schema instanceof ObjectSchema ? schema._schemaItems : {};

        for (const [field, error] of Object.entries(serror)) {
            const fullPath = prefix ? `${prefix}.${field}` : field;
            const item = schemaItems[field];
            const description = getDescription(item);

            const currentValue = value?.[field];
            const typeInfo = getTypeInfo(currentValue);
            const valueDisplay =
                currentValue === undefined ? 'undefined' : JSON.stringify(currentValue);

            lines.push(`${indent}→ ${fullPath} (${typeInfo} = ${valueDisplay}): ${description}`);

            if (Array.isArray(error)) {
                for (const e of error) {
                    if (typeof e === 'string') {
                        lines.push(`${indent}  - ${e}`);
                    } else if (typeof e === 'object' && e !== null) {
                        lines.push(
                            ...this._formatErrorsWithSchema(
                                item instanceof Schema ? item : undefined,
                                currentValue,
                                e,
                                fullPath,
                                depth + 1
                            )
                        );
                    }
                }
            } else if (typeof error === 'object' && error !== null) {
                lines.push(
                    ...this._formatErrorsWithSchema(
                        item instanceof Schema ? item : undefined,
                        currentValue,
                        error,
                        fullPath,
                        depth + 1
                    )
                );
            }
        }

        return lines;
    }

    /**
     * To a string
     * @return {string}
     */
    public toString(): string {
        const schema = this._schema;
        const errors = this._serror?.[0] || {};
        const valueObj = this._value || {};

        const lines = this._formatErrorsWithSchema(schema, valueObj, errors);

        return lines.join('\n');
    }

}