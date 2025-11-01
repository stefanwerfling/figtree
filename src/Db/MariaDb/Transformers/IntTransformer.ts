import {ValueTransformer} from 'typeorm';
import {Vts} from 'vts';

/**
 * Int (from DB int) transformer
 */
export class IntTransformer implements ValueTransformer {

    /**
     * From DB to Backend
     * @param {unknown} val
     * @returns {number}
     */
    public from(val: unknown): string | null {
        if (Vts.isNull(val)) {
            return null;
        }

        if (Vts.isString(val)) {
            return val;
        }

        if (Vts.isNumber(val)) {
            return val.toString(10);
        }

        throw new Error('Transformer was given an incompatible value.');
    }

    /**
     * From Backend to DB
     * @param {unknown} val
     * @returns {string}
     */
    public to(val: unknown): number | null {
        if (Vts.isNull(val)) {
            return null;
        }

        if (Vts.isNumber(val)) {
            return val;
        }

        if (Vts.isString(val)) {
            const val2 = parseInt(val, 10);

            if (Vts.isNumber(val2)) {
                return val2;
            }
        }

        throw new Error('Transformer was given an incompatible value.');
    }

}