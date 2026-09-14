export declare class Asn1Der {
    static concat(parts: Uint8Array[]): Uint8Array;
    static sequence(items: Uint8Array[]): Uint8Array;
    static set(items: Uint8Array[]): Uint8Array;
    static integer(value: number): Uint8Array;
    static integerFromBytes(magnitude: Uint8Array): Uint8Array;
    static boolean(value: boolean): Uint8Array;
    static nullValue(): Uint8Array;
    static objectIdentifier(oid: string): Uint8Array;
    static octetString(content: Uint8Array): Uint8Array;
    static bitString(content: Uint8Array, unusedBits?: number): Uint8Array;
    static utf8String(value: string): Uint8Array;
    static ia5String(value: string): Uint8Array;
    static utcTime(date: Date): Uint8Array;
    static generalizedTime(date: Date): Uint8Array;
    static explicit(tagNumber: number, content: Uint8Array): Uint8Array;
    static implicit(tagNumber: number, content: Uint8Array): Uint8Array;
    private static _tlv;
    private static _length;
    private static _base128;
    private static _dateBody;
    private static _pad2;
}
