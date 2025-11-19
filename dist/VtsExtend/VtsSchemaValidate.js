import { VtsSchemaError } from './VtsSchemaError.js';
export class VtsSchemaValidate {
    static validateExcept(schema, data) {
        const errors = [];
        if (schema.validate(data, errors)) {
            return true;
        }
        throw new VtsSchemaError(schema, data, errors);
    }
}
//# sourceMappingURL=VtsSchemaValidate.js.map