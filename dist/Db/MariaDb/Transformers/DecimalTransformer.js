export class DecimalTransformer {
    to(value) {
        return parseFloat(value) || 0;
    }
    from(value) {
        return value ? value.toString() : '';
    }
}
//# sourceMappingURL=DecimalTransformer.js.map