import { Vts } from 'vts';
export class BoolTransformer {
    from(value) {
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
    to(value) {
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
//# sourceMappingURL=BoolTransformer.js.map