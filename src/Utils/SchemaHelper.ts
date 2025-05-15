import {Schema} from 'vts';

export type SchemaHelperSwaggerIn = 'query'|'path'|'header'|'cookie';

export type SchemaHelperSwaggerReturnParam = {
    name: string;
    in: SchemaHelperSwaggerIn;
    required: boolean;
    description: string;
    schema: {
        type: string;
    }
};

export class SchemaHelper {

    protected static _convertType(descript: object): object {
        const rType = {
            type: 'unknown',
            description: undefined as undefined|string,
        };

        if ( ('type' in descript) && (typeof descript.type === 'string')) {
            rType.type = descript.type;
        }

        if (('description' in descript) && (typeof descript.description === 'string')) {
            rType.description = descript.description;
        }

        return rType;
    }

    protected static _convertOr(descript: object): object {
        const rOr = {
            description: undefined as undefined|string,
            oneOf: [] as Record<string, any>[]
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

    protected static _convertEnum(descript: object): object {
        const rEnum = {
            description: undefined as undefined|string,
            type: 'string',
            oneOf: [] as object[]
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

    protected static _convertObject(descript: object): object {
        const rObject = {
            type: 'object',
            description: undefined as undefined|string,
            required: [] as string[],
            properties: {} as Record<string, any>
        };

        if (('description' in descript) && (typeof descript.description === 'string')) {
            rObject.description = descript.description;
        }

        if (('items' in descript) && (typeof descript.items === 'object') && (descript.items !== null)) {
            for (const [key, value] of Object.entries(descript.items)) {
                let tObject: any = this._convertByType(value);

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

    public static _convertByType(descript: object): object|null {
        if ('type' in descript) {
            // object
            // array
            // object2
            // or

            // boolean
            // date
            // error
            // equal
            // instanceOf
            // null
            // number
            // regExp
            // string
            // undefined
            // unknown

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

    public static convertSchemaToSwagger<T>(schema: Schema<T>): any {
        const descript = schema.describe();

        return this._convertByType(descript);
    }

    /**
     * Convert Schema to swagger response
     * @param {string} statusCode
     * @param {Schema} schema
     * @return any
     */
    public static convertSchemaToSwaggerResponse<T>(statusCode: string, schema: Schema<T>): any {
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

    public static convertSchemaToSwaggerRequest<T>(schema: Schema<T>): any {
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

    /**
     * Convert a Schema to swagger parameter
     * @param {SchemaHelperSwaggerIn} instr
     * @param {Schema} schema
     * @return {SchemaHelperSwaggerReturnParam}
     */
    public static convertSchemaToSwaggerParameter<T>(instr: SchemaHelperSwaggerIn, schema: Schema<T>): SchemaHelperSwaggerReturnParam[] {
        const params: SchemaHelperSwaggerReturnParam[] = [];

        const descript = schema.describe();

        if (('items' in descript) && (typeof descript.items === 'object') && (descript.items !== null)) {
            for (const [key, value] of Object.entries(descript.items)) {
                if ( ('type' in value) && (typeof value.type === 'string')) {
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