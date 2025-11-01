import { Vts } from 'vts';
export class IntTransformer {
    from(val) {
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
    to(val) {
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
//# sourceMappingURL=IntTransformer.js.map