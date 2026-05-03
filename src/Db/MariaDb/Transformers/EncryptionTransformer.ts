import {ValueTransformer} from 'typeorm';

/**
 * Encrypt a DB value and Decrypt for application
 */
export class EncryptionTransformer implements ValueTransformer {

    /**
     * From Backend to DB
     * @param {string} _value
     * @return {string}
     */
    public to(_value: string): string {
        return '';
    }

    /**
     * From DB to Backend
     * @param {string} _value
     * @return {string}
     */
    public from(_value: string): string {
        return '';
    }

}