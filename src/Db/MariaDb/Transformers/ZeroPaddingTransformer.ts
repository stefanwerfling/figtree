import {ValueTransformer} from 'typeorm';

/**
 * Zero Padding 15 Transformer
 */
export class ZeroPadding15Transformer implements ValueTransformer {

    /**
     * to
     * @param {string|null} value
     * @return {string|null}
     */
    public to(value: string | null): string | null {
        if (value === null) {
            return null;
        }

        return value.padStart(15, '0');
    }

    /**
     * from
     * @param {string|null} value
     * @return {string|null}
     */
    public from(value: string | null): string | null {
        if (value === null) {
            return null;
        }

        return value.replace(/^0+/, '');
    }

}