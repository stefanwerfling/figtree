import { Schema } from 'vts';
export declare class VtsSchemaValidate {
    static validateExcept<T>(schema: Schema<T>, data: unknown): boolean;
}
