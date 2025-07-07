export class BufferHelper {
    static splitBuffer(tBuffer, separator) {
        const arr = [];
        const sepBuf = typeof separator === 'string'
            ? Buffer.from(separator)
            : separator;
        const len = sepBuf.length;
        let pos = 0;
        let idx = tBuffer.indexOf(separator, pos);
        while (idx !== -1) {
            if (idx > pos) {
                arr.push(tBuffer.subarray(pos, idx));
            }
            pos = idx + len;
            idx = tBuffer.indexOf(separator, pos);
        }
        if (pos < tBuffer.length) {
            arr.push(tBuffer.subarray(pos));
        }
        return arr;
    }
}
//# sourceMappingURL=BufferHelper.js.map