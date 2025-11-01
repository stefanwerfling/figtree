import {ValueTransformer} from 'typeorm';
import {Vts} from 'vts';

/**
 * Convert a DB int value to boolean
 */
export class BoolTransformer implements ValueTransformer {

    /**
     * From DB to Backend
     * @param {unknown} value
     * @returns {boolean}
     */
    public from(value: unknown): boolean {
        if (Vts.isBoolean(value)) {
            return value;
        }

        if (Vts.isNumber(value)) {
            if (value === 1) {
                return true;
            }
        }

        return false;
    }

    /**
     * From Backend to DB
     * @param {unknown} value
     * @returns {string}
     */
    public to(value: unknown): number {
        if (Vts.isBoolean(value)) {
            if (value) {
                return 1;
            }
        }

        if (Vts.isNumber(value)) {
            if (value === 1) {
                return 1;
            }
        }

        return 0;
    }

}