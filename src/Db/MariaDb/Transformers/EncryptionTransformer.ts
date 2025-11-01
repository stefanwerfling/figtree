import {ValueTransformer} from 'typeorm';

/**
 * Encrypt a DB value and Decrypt for application
 */
export class EncryptionTransformer implements ValueTransformer {

    /**
     * From Backend to DB
     * @param {string} value
     * @return {string}
     */
    public to(value: string): string {
        return '';
    }

    /**
     * From DB to Backend
     * @param {string} value
     * @return {string}
     */
    public from(value: string): string {
        return '';
    }

}