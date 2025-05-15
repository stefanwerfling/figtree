export class SchemaHelper {
    static _convertType(descript) {
        const rType = {
            type: 'unknown',
            description: undefined,
        };
        if (('type' in descript) && (typeof descript.type === 'string')) {
            rType.type = descript.type;
        }
        if (('description' in descript) && (typeof descript.description === 'string')) {
            rType.description = descript.description;
        }
        return rType;
    }
    static _convertOr(descript) {
        const rOr = {
            description: undefined,
            oneOf: []
        };
        if (('description' in descript) && (typeof descript.description === 'string')) {
            rOr.description = descript.description;
        }
        if ('values' in descript && Array.isArray(descript.values)) {
            for (const value of descript.values) {
                const tObject = this._convertByType(value);
                if (tObject !== null) {
                    rOr.oneOf.push(tObject);
                }
            }
        }
        return rOr;
    }
    static _convertEnum(descript) {
        const rEnum = {
            description: undefined,
            type: 'string',
            oneOf: []
        };
        if ('values' in descript && Array.isArray(descript.values)) {
            for (const [key, value] of Object.entries(descript.values)) {
                let description = '';
                if (('description' in value) && (typeof value.description === 'string')) {
                    description = value.description;
                }
                rEnum.oneOf.push({
                    const: key,
                    description: description
                });
            }
        }
        return rEnum;
    }
    static _convertObject(descript) {
        const rObject = {
            type: 'object',
            description: undefined,
            required: [],
            properties: {}
        };
        if (('description' in descript) && (typeof descript.description === 'string')) {
            rObject.description = descript.description;
        }
        if (('items' in descript) && (typeof descript.items === 'object') && (descript.items !== null)) {
            for (const [key, value] of Object.entries(descript.items)) {
                let tObject = this._convertByType(value);
                if (tObject !== null) {
                    rObject.properties[key] = tObject;
                    if (!('optional' in value) || !value.optional) {
                        rObject.required.push(key);
                    }
                }
            }
        }
        return rObject;
    }
    static _convertByType(descript) {
        if ('type' in descript) {
            switch (descript.type) {
                case 'object':
                case 'object2':
                    return this._convertObject(descript);
                case 'or':
                    return this._convertOr(descript);
                case 'enum':
                    return this._convertEnum(descript);
                default:
                    return this._convertType(descript);
            }
        }
        return null;
    }
    static convertSchemaToSwagger(schema) {
        const descript = schema.describe();
        return this._convertByType(descript);
    }
    static convertSchemaToSwaggerResponse(statusCode, schema) {
        const tSchema = this.convertSchemaToSwagger(schema);
        let description = 'Unknow descripted';
        if (('description' in tSchema) && (typeof tSchema.description === 'string')) {
            description = tSchema.description;
        }
        return {
            [statusCode]: {
                description: description || '',
                content: {
                    'application/json': {
                        schema: tSchema
                    }
                }
            }
        };
    }
    static convertSchemaToSwaggerRequest(schema) {
        const tSchema = this.convertSchemaToSwagger(schema);
        let description = 'Unknow descripted';
        if (('description' in tSchema) && (typeof tSchema.description === 'string')) {
            description = tSchema.description;
        }
        return {
            required: true,
            description: description || '',
            content: {
                'application/json': {
                    schema: tSchema
                }
            }
        };
    }
    static convertSchemaToSwaggerParameter(instr, schema) {
        const params = [];
        const descript = schema.describe();
        if (('items' in descript) && (typeof descript.items === 'object') && (descript.items !== null)) {
            for (const [key, value] of Object.entries(descript.items)) {
                if (('type' in value) && (typeof value.type === 'string')) {
                    switch (value.type) {
                        case 'object':
                        case 'object2':
                        case 'or':
                        case 'enum':
                            break;
                        default: {
                            const required = !(('optional' in value) && value.optional);
                            let description = 'Unknow descripted';
                            if (('description' in value) && (typeof value.description === 'string')) {
                                description = value.description;
                            }
                            params.push({
                                name: key,
                                in: instr,
                                required: required,
                                description: description,
                                schema: {
                                    type: value.type
                                }
                            });
                        }
                    }
                }
            }
        }
        return params;
    }
}
//# sourceMappingURL=SchemaHelper.js.map