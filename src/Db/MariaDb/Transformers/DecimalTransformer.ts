import {ValueTransformer} from 'typeorm';

/**
 * Convert a DB int value to string
 * - It is used for money
 */
export class DecimalTransformer implements ValueTransformer {

    /**
     * From Backend to DB
     * @param {string} value
     * @return {number}
     */
    public to(value: string): number {
        return parseFloat(value) || 0;
    }

    /**
     * From DB to Backend
     * @param {number} value
     * @return {string}
     */
    public from(value: number|null): string {
        return value ? value.toString() : '';
    }

}