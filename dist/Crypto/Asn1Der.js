export class Asn1Der {
    static concat(parts) {
        const total = parts.reduce((sum, part) => sum + part.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        for (const part of parts) {
            out.set(part, offset);
            offset += part.length;
        }
        return out;
    }
    static sequence(items) {
        return Asn1Der._tlv(0x30, Asn1Der.concat(items));
    }
    static set(items) {
        return Asn1Der._tlv(0x31, Asn1Der.concat(items));
    }
    static integer(value) {
        if (value < 0 || !Number.isSafeInteger(value)) {
            throw new Error('Asn1Der.integer: only non-negative safe integers are supported');
        }
        const bytes = [];
        let remaining = value;
        do {
            bytes.unshift(remaining & 0xff);
            remaining = Math.floor(remaining / 256);
        } while (remaining > 0);
        return Asn1Der.integerFromBytes(Uint8Array.from(bytes));
    }
    static integerFromBytes(magnitude) {
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
    static boolean(value) {
        return Asn1Der._tlv(0x01, Uint8Array.of(value ? 0xff : 0x00));
    }
    static nullValue() {
        return Asn1Der._tlv(0x05, new Uint8Array(0));
    }
    static objectIdentifier(oid) {
        const parts = oid.split('.').map((part) => Number(part));
        if (parts.length < 2) {
            throw new Error(`Asn1Der.objectIdentifier: invalid OID "${oid}"`);
        }
        const bytes = [(40 * parts[0]) + parts[1]];
        for (const part of parts.slice(2)) {
            bytes.push(...Asn1Der._base128(part));
        }
        return Asn1Der._tlv(0x06, Uint8Array.from(bytes));
    }
    static octetString(content) {
        return Asn1Der._tlv(0x04, content);
    }
    static bitString(content, unusedBits = 0) {
        return Asn1Der._tlv(0x03, Asn1Der.concat([Uint8Array.of(unusedBits), content]));
    }
    static utf8String(value) {
        return Asn1Der._tlv(0x0c, new TextEncoder().encode(value));
    }
    static ia5String(value) {
        return Asn1Der._tlv(0x16, new TextEncoder().encode(value));
    }
    static utcTime(date) {
        const yy = Asn1Der._pad2(date.getUTCFullYear() % 100);
        const value = `${yy}${Asn1Der._dateBody(date)}Z`;
        return Asn1Der._tlv(0x17, new TextEncoder().encode(value));
    }
    static generalizedTime(date) {
        const value = `${date.getUTCFullYear()}${Asn1Der._dateBody(date)}Z`;
        return Asn1Der._tlv(0x18, new TextEncoder().encode(value));
    }
    static explicit(tagNumber, content) {
        return Asn1Der._tlv(0xa0 + tagNumber, content);
    }
    static implicit(tagNumber, content) {
        return Asn1Der._tlv(0x80 + tagNumber, content);
    }
    static _tlv(tag, content) {
        return Asn1Der.concat([Uint8Array.of(tag), Asn1Der._length(content.length), content]);
    }
    static _length(length) {
        if (length < 0x80) {
            return Uint8Array.of(length);
        }
        const bytes = [];
        let remaining = length;
        while (remaining > 0) {
            bytes.unshift(remaining & 0xff);
            remaining = Math.floor(remaining / 256);
        }
        return Uint8Array.from([0x80 | bytes.length, ...bytes]);
    }
    static _base128(value) {
        const bytes = [value & 0x7f];
        let remaining = Math.floor(value / 128);
        while (remaining > 0) {
            bytes.unshift((remaining & 0x7f) | 0x80);
            remaining = Math.floor(remaining / 128);
        }
        return bytes;
    }
    static _dateBody(date) {
        return `${Asn1Der._pad2(date.getUTCMonth() + 1)}${Asn1Der._pad2(date.getUTCDate())}` +
            `${Asn1Der._pad2(date.getUTCHours())}${Asn1Der._pad2(date.getUTCMinutes())}${Asn1Der._pad2(date.getUTCSeconds())}`;
    }
    static _pad2(value) {
        return value.toString().padStart(2, '0');
    }
}
//# sourceMappingURL=Asn1Der.js.map