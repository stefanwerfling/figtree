/* eslint-disable no-bitwise -- DER is a byte/bit encoding; bitwise ops are intrinsic. */

/**
 * Minimal DER (Distinguished Encoding Rules) encoder. Each method returns the
 * complete TLV (tag-length-value) byte string for one ASN.1 value; constructed
 * types (sequence/set) compose child encodings. DER only: definite lengths,
 * minimal integer/length encodings. Used by {@link X509Rsa} to build X.509
 * certificates without a third-party dependency.
 */
export class Asn1Der {

    /**
     * Concatenate byte arrays.
     * @param {Uint8Array[]} parts - the byte arrays
     * @return {Uint8Array}
     */
    public static concat(parts: Uint8Array[]): Uint8Array {
        const total = parts.reduce((sum, part) => sum + part.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;

        for (const part of parts) {
            out.set(part, offset);
            offset += part.length;
        }

        return out;
    }

    /**
     * A SEQUENCE (tag 0x30) of the given already-encoded members.
     * @param {Uint8Array[]} items - the encoded members
     * @return {Uint8Array}
     */
    public static sequence(items: Uint8Array[]): Uint8Array {
        return Asn1Der._tlv(0x30, Asn1Der.concat(items));
    }

    /**
     * A SET (tag 0x31) of the given already-encoded members.
     * @param {Uint8Array[]} items - the encoded members
     * @return {Uint8Array}
     */
    public static set(items: Uint8Array[]): Uint8Array {
        return Asn1Der._tlv(0x31, Asn1Der.concat(items));
    }

    /**
     * An INTEGER (tag 0x02) from a non-negative JS number.
     * @param {number} value - the non-negative integer
     * @return {Uint8Array}
     */
    public static integer(value: number): Uint8Array {
        if (value < 0 || !Number.isSafeInteger(value)) {
            throw new Error('Asn1Der.integer: only non-negative safe integers are supported');
        }

        const bytes: number[] = [];
        let remaining = value;

        do {
            bytes.unshift(remaining & 0xff);
            remaining = Math.floor(remaining / 256);
        } while (remaining > 0);

        return Asn1Der.integerFromBytes(Uint8Array.from(bytes));
    }

    /**
     * An INTEGER (tag 0x02) from raw big-endian magnitude bytes, treated as a
     * non-negative value (a leading 0x00 is prepended when the high bit is set, so
     * it never reads as negative). Leading zero bytes are trimmed first.
     * @param {Uint8Array} magnitude - big-endian magnitude bytes
     * @return {Uint8Array}
     */
    public static integerFromBytes(magnitude: Uint8Array): Uint8Array {
        let start = 0;

        while (start < magnitude.length - 1 && magnitude[start] === 0x00) {
            start += 1;
        }

        let value = magnitude.subarray(start);

        if (value.length === 0) {
            value = Uint8Array.of(0x00);
        }

        if ((value[0] & 0x80) !== 0) {
            value = Asn1Der.concat([Uint8Array.of(0x00), value]);
        }

        return Asn1Der._tlv(0x02, value);
    }

    /**
     * A BOOLEAN (tag 0x01): DER encodes true as 0xFF.
     * @param {boolean} value - the boolean
     * @return {Uint8Array}
     */
    public static boolean(value: boolean): Uint8Array {
        return Asn1Der._tlv(0x01, Uint8Array.of(value ? 0xff : 0x00));
    }

    /**
     * A NULL (tag 0x05).
     * @return {Uint8Array}
     */
    public static nullValue(): Uint8Array {
        return Asn1Der._tlv(0x05, new Uint8Array(0));
    }

    /**
     * An OBJECT IDENTIFIER (tag 0x06) from a dotted string, e.g. '2.5.4.3'.
     * @param {string} oid - the dotted OID
     * @return {Uint8Array}
     */
    public static objectIdentifier(oid: string): Uint8Array {
        const parts = oid.split('.').map((part) => Number(part));

        if (parts.length < 2) {
            throw new Error(`Asn1Der.objectIdentifier: invalid OID "${oid}"`);
        }

        const bytes: number[] = [(40 * parts[0]) + parts[1]];

        for (const part of parts.slice(2)) {
            bytes.push(...Asn1Der._base128(part));
        }

        return Asn1Der._tlv(0x06, Uint8Array.from(bytes));
    }

    /**
     * An OCTET STRING (tag 0x04) wrapping the given content.
     * @param {Uint8Array} content - the raw content bytes
     * @return {Uint8Array}
     */
    public static octetString(content: Uint8Array): Uint8Array {
        return Asn1Der._tlv(0x04, content);
    }

    /**
     * A BIT STRING (tag 0x03) with the given number of unused trailing bits.
     * @param {Uint8Array} content - the bit-string content bytes
     * @param {number} unusedBits - number of unused trailing bits (0..7), default 0
     * @return {Uint8Array}
     */
    public static bitString(content: Uint8Array, unusedBits: number = 0): Uint8Array {
        return Asn1Der._tlv(0x03, Asn1Der.concat([Uint8Array.of(unusedBits), content]));
    }

    /**
     * A UTF8String (tag 0x0C).
     * @param {string} value - the string
     * @return {Uint8Array}
     */
    public static utf8String(value: string): Uint8Array {
        return Asn1Der._tlv(0x0c, new TextEncoder().encode(value));
    }

    /**
     * An IA5String (tag 0x16), for ASCII values such as DNS names / URIs.
     * @param {string} value - the string
     * @return {Uint8Array}
     */
    public static ia5String(value: string): Uint8Array {
        return Asn1Der._tlv(0x16, new TextEncoder().encode(value));
    }

    /**
     * A UTCTime (tag 0x17), 'YYMMDDHHMMSSZ' — valid for years 1950..2049.
     * @param {Date} date - the date
     * @return {Uint8Array}
     */
    public static utcTime(date: Date): Uint8Array {
        const yy = Asn1Der._pad2(date.getUTCFullYear() % 100);
        const value = `${yy}${Asn1Der._dateBody(date)}Z`;

        return Asn1Der._tlv(0x17, new TextEncoder().encode(value));
    }

    /**
     * A GeneralizedTime (tag 0x18), 'YYYYMMDDHHMMSSZ' — for years outside 1950..2049.
     * @param {Date} date - the date
     * @return {Uint8Array}
     */
    public static generalizedTime(date: Date): Uint8Array {
        const value = `${date.getUTCFullYear()}${Asn1Der._dateBody(date)}Z`;

        return Asn1Der._tlv(0x18, new TextEncoder().encode(value));
    }

    /**
     * A context-specific EXPLICIT tag [n] (constructed) wrapping the content.
     * @param {number} tagNumber - the context tag number (0..30)
     * @param {Uint8Array} content - the already-encoded inner value
     * @return {Uint8Array}
     */
    public static explicit(tagNumber: number, content: Uint8Array): Uint8Array {
        return Asn1Der._tlv(0xa0 + tagNumber, content);
    }

    /**
     * A context-specific IMPLICIT primitive tag [n], for the raw content bytes.
     * @param {number} tagNumber - the context tag number (0..30)
     * @param {Uint8Array} content - the raw content bytes
     * @return {Uint8Array}
     */
    public static implicit(tagNumber: number, content: Uint8Array): Uint8Array {
        return Asn1Der._tlv(0x80 + tagNumber, content);
    }

    /**
     * Assemble one TLV: tag byte + DER length + content.
     * @param {number} tag - the (already-composed) tag byte
     * @param {Uint8Array} content - the value bytes
     * @return {Uint8Array}
     */
    private static _tlv(tag: number, content: Uint8Array): Uint8Array {
        return Asn1Der.concat([Uint8Array.of(tag), Asn1Der._length(content.length), content]);
    }

    /**
     * DER definite length encoding.
     * @param {number} length - the content length
     * @return {Uint8Array}
     */
    private static _length(length: number): Uint8Array {
        if (length < 0x80) {
            return Uint8Array.of(length);
        }

        const bytes: number[] = [];
        let remaining = length;

        while (remaining > 0) {
            bytes.unshift(remaining & 0xff);
            remaining = Math.floor(remaining / 256);
        }

        return Uint8Array.from([0x80 | bytes.length, ...bytes]);
    }

    /**
     * base-128 (7-bit) encoding of one OID sub-identifier (high bit set on all but
     * the last byte).
     * @param {number} value - the sub-identifier
     * @return {number[]}
     */
    private static _base128(value: number): number[] {
        const bytes: number[] = [value & 0x7f];
        let remaining = Math.floor(value / 128);

        while (remaining > 0) {
            bytes.unshift((remaining & 0x7f) | 0x80);
            remaining = Math.floor(remaining / 128);
        }

        return bytes;
    }

    /**
     * The 'MMDDHHMMSS' body shared by the two time formats.
     * @param {Date} date - the date
     * @return {string}
     */
    private static _dateBody(date: Date): string {
        return `${Asn1Der._pad2(date.getUTCMonth() + 1)}${Asn1Der._pad2(date.getUTCDate())}` +
            `${Asn1Der._pad2(date.getUTCHours())}${Asn1Der._pad2(date.getUTCMinutes())}${Asn1Der._pad2(date.getUTCSeconds())}`;
    }

    /**
     * Zero-pad a number to two digits.
     * @param {number} value - the number (0..99)
     * @return {string}
     */
    private static _pad2(value: number): string {
        return value.toString().padStart(2, '0');
    }

}