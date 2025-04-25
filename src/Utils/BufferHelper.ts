/**
 * Buffer helper class
 */
export class BufferHelper {

    /**
     * Split a Buffer in parts
     * @param {Buffer} tBuffer
     * @param {string|Buffer} separator
     */
    public static splitBuffer(tBuffer: Buffer, separator: string|Buffer): Buffer[] {
        const arr: Buffer[] = [];
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