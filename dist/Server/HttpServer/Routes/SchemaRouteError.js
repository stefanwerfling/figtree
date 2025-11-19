import { VtsSchemaError } from '../../../VtsExtend/VtsSchemaError.js';
export class SchemaRouteError extends VtsSchemaError {
    _descriptionName;
    constructor(schema, value, error, descriptionName) {
        super(schema, value, error);
        this._descriptionName = descriptionName;
    }
    toString() {
        let str = `DescriptionSchema: ${this._descriptionName} - `;
        str += super.toString();
        return str;
    }
}
//# sourceMappingURL=SchemaRouteError.js.map