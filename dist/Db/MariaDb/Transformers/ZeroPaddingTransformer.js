export class ZeroPadding15Transformer {
    to(value) {
        if (value === null) {
            return null;
        }
        return value.padStart(15, '0');
    }
    from(value) {
        if (value === null) {
            return null;
        }
        return value.replace(/^0+/, '');
    }
}
//# sourceMappingURL=ZeroPaddingTransformer.js.map