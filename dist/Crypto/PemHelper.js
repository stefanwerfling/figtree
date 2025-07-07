import { Logger } from '../Logger/Logger.js';
import { PemObject } from './Pem/PemObject.js';
export class PemHelper {
    static isPemStr(pemStr) {
        try {
            const pemObj = new PemObject();
            pemObj.decode(pemStr);
        }
        catch (e) {
            if (Logger.hasLogger()) {
                Logger.getLogger().error('PemHelper::isPemStr: Pem string is not in pem format!');
            }
            else {
                console.log(e);
            }
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=PemHelper.js.map