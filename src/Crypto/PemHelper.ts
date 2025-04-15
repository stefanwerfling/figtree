import {Logger} from '../Logger/Logger.js';
import {PemObject} from './Pem/PemObject.js';

/**
 * Pem Helper object
 */
export class PemHelper {

    /**
     * Check is string in PEM format
     * @param {string} pemStr
     * @returns {string}
     */
    public static isPemStr(pemStr: string): boolean {
        try {
            const pemObj = new PemObject();
            pemObj.decode(pemStr);
        } catch (e) {
            if (Logger.hasLogger()) {
                Logger.getLogger().error('PemHelper::isPemStr: Pem string is not in pem format!');
            } else {
                console.log(e);
            }

            return false;
        }

        return true;
    }

}