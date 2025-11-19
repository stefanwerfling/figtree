import { ObjectSchema, Schema } from 'vts';
export class VtsSchemaError extends Error {
    _schema;
    _value;
    _serror;
    constructor(schema, value, error) {
        super();
        this._schema = schema;
        this._value = value;
        this._serror = error;
    }
    getSchema() {
        return this._schema;
    }
    getSchemaError() {
        return this._serror;
    }
    _isSchema(obj) {
        return obj instanceof Schema;
    }
    _formatErrorsWithSchema(schema, value, serror, prefix = '', depth = 0) {
        const lines = [];
        const indent = '  '.repeat(depth);
        if (!serror || typeof serror !== 'object') {
            return lines;
        }
        const getTypeInfo = (val) => {
            if (val === null) {
                return 'null';
            }
            if (Array.isArray(val)) {
                return 'array';
            }
            return typeof val;
        };
        const getDescription = (item) => {
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
            const valueDisplay = currentValue === undefined ? 'undefined' : JSON.stringify(currentValue);
            lines.push(`${indent}→ ${fullPath} (${typeInfo} = ${valueDisplay}): ${description}`);
            if (Array.isArray(error)) {
                for (const e of error) {
                    if (typeof e === 'string') {
                        lines.push(`${indent}  - ${e}`);
                    }
                    else if (typeof e === 'object' && e !== null) {
                        lines.push(...this._formatErrorsWithSchema(item instanceof Schema ? item : undefined, currentValue, e, fullPath, depth + 1));
                    }
                }
            }
            else if (typeof error === 'object' && error !== null) {
                lines.push(...this._formatErrorsWithSchema(item instanceof Schema ? item : undefined, currentValue, error, fullPath, depth + 1));
            }
        }
        return lines;
    }
    toString() {
        const schema = this._schema;
        const errors = this._serror?.[0] || {};
        const valueObj = this._value || {};
        const lines = this._formatErrorsWithSchema(schema, valueObj, errors);
        return lines.join('\n');
    }
}
//# sourceMappingURL=VtsSchemaError.js.map