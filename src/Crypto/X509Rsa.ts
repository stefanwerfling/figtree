/* eslint-disable no-bitwise -- KeyUsage bit packing is a bit operation by nature. */
import * as crypto from 'crypto';
import {Asn1Der} from './Asn1Der.js';

/**
 * One relative-distinguished-name attribute: a long name (e.g. 'commonName') or a
 * short name (e.g. 'CN') plus its value.
 */
export type X509RsaAttr = {
    name?: string;
    shortName?: string;
    value: string;
};

/**
 * A subset of the X.509 v3 extensions, in the shape node-forge accepted, so
 * existing callers keep working. `name` selects the extension; the remaining
 * fields configure it.
 */
export type X509RsaExt = {
    name: string;
    critical?: boolean;
    cA?: boolean;
    pathLenConstraint?: number;
    digitalSignature?: boolean;
    nonRepudiation?: boolean;
    keyEncipherment?: boolean;
    dataEncipherment?: boolean;
    keyAgreement?: boolean;
    keyCertSign?: boolean;
    cRLSign?: boolean;
    serverAuth?: boolean;
    clientAuth?: boolean;
    codeSigning?: boolean;
    emailProtection?: boolean;
    timeStamping?: boolean;
    altNames?: {type: number; value: string;}[];
};

const OID_SHA256_RSA = '1.2.840.113549.1.1.11';
const MS_PER_DAY = 86400000;
const DAYS_PER_YEAR = 365;
const UTC_TIME_YEAR_LIMIT = 2050;
const IPV4_OCTETS = 4;
const BYTE_MASK = 0xff;
const HIGH_BIT = 0x80;
const HEX_RADIX = 16;

// Keyed by the lower-cased attribute name / shortName (forge accepts both forms).
const ATTR_OID: Record<string, string> = {
    commonname: '2.5.4.3',
    cn: '2.5.4.3',
    countryname: '2.5.4.6',
    c: '2.5.4.6',
    localityname: '2.5.4.7',
    l: '2.5.4.7',
    stateorprovincename: '2.5.4.8',
    st: '2.5.4.8',
    organizationname: '2.5.4.10',
    o: '2.5.4.10',
    organizationalunitname: '2.5.4.11',
    ou: '2.5.4.11'
};

const EXT_OID = {
    basicConstraints: '2.5.29.19',
    keyUsage: '2.5.29.15',
    extKeyUsage: '2.5.29.37',
    subjectAltName: '2.5.29.17'
};

const EKU_OID: Record<string, string> = {
    serverAuth: '1.3.6.1.5.5.7.3.1',
    clientAuth: '1.3.6.1.5.5.7.3.2',
    codeSigning: '1.3.6.1.5.5.7.3.3',
    emailProtection: '1.3.6.1.5.5.7.3.4',
    timeStamping: '1.3.6.1.5.5.7.3.8'
};

// KeyUsage bit positions (bit 0 is the most significant), forge flag -> position.
const KEY_USAGE_BITS: {flag: keyof X509RsaExt; bit: number;}[] = [
    {flag: 'digitalSignature', bit: 0},
    {flag: 'nonRepudiation', bit: 1},
    {flag: 'keyEncipherment', bit: 2},
    {flag: 'dataEncipherment', bit: 3},
    {flag: 'keyAgreement', bit: 4},
    {flag: 'keyCertSign', bit: 5},
    {flag: 'cRLSign', bit: 6}
];

/**
 * Options for {@link X509Rsa.createCertificate}.
 */
export type X509RsaCertOptions = {
    subjectPublicKeyPem: string;
    signingKeyPem: string;
    attrs: X509RsaAttr[];
    exts: X509RsaExt[];
    validYears: number;
    serialNumberHex: string;
};

/**
 * Builds and RSA-signs X.509 v3 certificates over Node's built-in crypto (RSA with
 * SHA-256) and {@link Asn1Der} — the node-forge-free replacement for the certificate
 * path in {@link CertificateHelper}. Issuer == subject (self-signed shape); a
 * separate signing key just re-signs the same subject.
 */
export class X509Rsa {

    /**
     * Build a certificate and return its PEM.
     * @param {X509RsaCertOptions} options - the certificate options
     * @return {string}
     */
    public static createCertificate(options: X509RsaCertOptions): string {
        const name = X509Rsa._name(options.attrs);
        const spki = X509Rsa._pemToDer(options.subjectPublicKeyPem);
        const signatureAlgorithm = Asn1Der.sequence([Asn1Der.objectIdentifier(OID_SHA256_RSA), Asn1Der.nullValue()]);

        const notBefore = new Date();
        const notAfter = new Date(notBefore.getTime() + (options.validYears * DAYS_PER_YEAR * MS_PER_DAY));

        const tbsItems = [
            Asn1Der.explicit(0, Asn1Der.integer(2)),
            Asn1Der.integerFromBytes(X509Rsa._hexToBytes(options.serialNumberHex)),
            signatureAlgorithm,
            name,
            Asn1Der.sequence([X509Rsa._time(notBefore), X509Rsa._time(notAfter)]),
            name,
            spki
        ];

        if (options.exts.length > 0) {
            tbsItems.push(Asn1Der.explicit(3, Asn1Der.sequence(options.exts.map((ext) => X509Rsa._extension(ext)))));
        }

        const tbs = Asn1Der.sequence(tbsItems);
        const signature = crypto.createSign('RSA-SHA256').update(tbs).sign(options.signingKeyPem);

        const certificate = Asn1Der.sequence([tbs, signatureAlgorithm, Asn1Der.bitString(new Uint8Array(signature))]);

        return X509Rsa._derToPem(certificate, 'CERTIFICATE');
    }

    /**
     * Build a Name (SEQUENCE OF SET OF ATV) from attributes.
     * @param {X509RsaAttr[]} attrs - the RDN attributes
     * @return {Uint8Array}
     */
    private static _name(attrs: X509RsaAttr[]): Uint8Array {
        return Asn1Der.sequence(attrs.map((attr) => {
            const key = (attr.name ?? attr.shortName ?? '').toLowerCase();
            const oid = ATTR_OID[key];

            if (oid === undefined) {
                throw new Error(`X509Rsa: unknown attribute "${attr.name ?? attr.shortName ?? ''}"`);
            }

            return Asn1Der.set([Asn1Der.sequence([Asn1Der.objectIdentifier(oid), Asn1Der.utf8String(attr.value)])]);
        }));
    }

    /**
     * Encode one supported extension from its forge-shaped object.
     * @param {X509RsaExt} ext - the extension descriptor
     * @return {Uint8Array}
     */
    private static _extension(ext: X509RsaExt): Uint8Array {
        if (ext.name === 'basicConstraints') {
            return X509Rsa._encodeExtension(EXT_OID.basicConstraints, ext.critical ?? true, X509Rsa._basicConstraints(ext));
        }

        if (ext.name === 'keyUsage') {
            return X509Rsa._encodeExtension(EXT_OID.keyUsage, ext.critical ?? true, X509Rsa._keyUsage(ext));
        }

        if (ext.name === 'extKeyUsage') {
            return X509Rsa._encodeExtension(EXT_OID.extKeyUsage, ext.critical ?? false, X509Rsa._extKeyUsage(ext));
        }

        if (ext.name === 'subjectAltName') {
            return X509Rsa._encodeExtension(EXT_OID.subjectAltName, ext.critical ?? false, X509Rsa._subjectAltName(ext));
        }

        throw new Error(`X509Rsa: unsupported extension "${ext.name}"`);
    }

    /**
     * Wrap an extension value in the Extension SEQUENCE (omitting critical=false).
     * @param {string} oid - the extension OID
     * @param {boolean} critical - the critical flag
     * @param {Uint8Array} value - the extension value bytes
     * @return {Uint8Array}
     */
    private static _encodeExtension(oid: string, critical: boolean, value: Uint8Array): Uint8Array {
        const items = [Asn1Der.objectIdentifier(oid)];

        if (critical) {
            items.push(Asn1Der.boolean(true));
        }

        items.push(Asn1Der.octetString(value));

        return Asn1Der.sequence(items);
    }

    /**
     * BasicConstraints value.
     * @param {X509RsaExt} ext - the extension descriptor
     * @return {Uint8Array}
     */
    private static _basicConstraints(ext: X509RsaExt): Uint8Array {
        const items: Uint8Array[] = [];

        if (ext.cA) {
            items.push(Asn1Der.boolean(true));
        }

        if (ext.pathLenConstraint !== undefined) {
            items.push(Asn1Der.integer(ext.pathLenConstraint));
        }

        return Asn1Der.sequence(items);
    }

    /**
     * KeyUsage value (a BIT STRING with bit 0 the most significant).
     * @param {X509RsaExt} ext - the extension descriptor
     * @return {Uint8Array}
     */
    private static _keyUsage(ext: X509RsaExt): Uint8Array {
        const bits = KEY_USAGE_BITS.filter((entry) => ext[entry.flag] === true).map((entry) => entry.bit);

        if (bits.length === 0) {
            throw new Error('X509Rsa: keyUsage extension has no bits set');
        }

        const maxBit = Math.max(...bits);
        const value = new Uint8Array(Math.floor(maxBit / 8) + 1);

        for (const bit of bits) {
            value[Math.floor(bit / 8)] |= HIGH_BIT >> (bit % 8);
        }

        return Asn1Der.bitString(value, (value.length * 8) - (maxBit + 1));
    }

    /**
     * ExtendedKeyUsage value (SEQUENCE OF KeyPurposeId).
     * @param {X509RsaExt} ext - the extension descriptor
     * @return {Uint8Array}
     */
    private static _extKeyUsage(ext: X509RsaExt): Uint8Array {
        const oids = Object.keys(EKU_OID).filter((key) => ext[key as keyof X509RsaExt] === true);

        if (oids.length === 0) {
            throw new Error('X509Rsa: extKeyUsage extension has no usages set');
        }

        return Asn1Der.sequence(oids.map((key) => Asn1Der.objectIdentifier(EKU_OID[key])));
    }

    /**
     * SubjectAltName value (SEQUENCE OF GeneralName). forge type numbers:
     * 1=rfc822Name, 2=dNSName, 6=URI (IA5String), 7=iPAddress (IPv4 octets).
     * @param {X509RsaExt} ext - the extension descriptor
     * @return {Uint8Array}
     */
    private static _subjectAltName(ext: X509RsaExt): Uint8Array {
        return Asn1Der.sequence((ext.altNames ?? []).map((entry) => {
            if (entry.type === 7) {
                return Asn1Der.implicit(7, X509Rsa._ipv4(entry.value));
            }

            if (entry.type === 1 || entry.type === 2 || entry.type === 6) {
                return Asn1Der.implicit(entry.type, new TextEncoder().encode(entry.value));
            }

            throw new Error(`X509Rsa: unsupported subjectAltName type ${entry.type}`);
        }));
    }

    /**
     * Parse an IPv4 literal to its 4 octets.
     * @param {string} value - the IPv4 literal
     * @return {Uint8Array}
     */
    private static _ipv4(value: string): Uint8Array {
        const octets = value.split('.').map((part) => Number(part));

        if (octets.length !== IPV4_OCTETS || octets.some((o) => !Number.isInteger(o) || o < 0 || o > BYTE_MASK)) {
            throw new Error(`X509Rsa: unsupported subjectAltName IP "${value}"`);
        }

        return Uint8Array.from(octets);
    }

    /**
     * Encode a Time as UTCTime (<2050) or GeneralizedTime.
     * @param {Date} date - the time
     * @return {Uint8Array}
     */
    private static _time(date: Date): Uint8Array {
        return date.getUTCFullYear() < UTC_TIME_YEAR_LIMIT ? Asn1Der.utcTime(date) : Asn1Der.generalizedTime(date);
    }

    /**
     * Decode a PEM body to its DER bytes.
     * @param {string} pem - the PEM string
     * @return {Uint8Array}
     */
    private static _pemToDer(pem: string): Uint8Array {
        const body = pem.replace(/-----BEGIN [^-]+-----/u, '').replace(/-----END [^-]+-----/u, '').replace(/\s+/gu, '');

        return new Uint8Array(Buffer.from(body, 'base64'));
    }

    /**
     * Wrap DER bytes in a PEM envelope (64-column base64).
     * @param {Uint8Array} der - the DER bytes
     * @param {string} label - the PEM label
     * @return {string}
     */
    private static _derToPem(der: Uint8Array, label: string): string {
        const lines = Buffer.from(der).toString('base64').match(/.{1,64}/gu) ?? [];

        return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
    }

    /**
     * Convert a hex string to bytes.
     * @param {string} hex - the hex string (even length)
     * @return {Uint8Array}
     */
    private static _hexToBytes(hex: string): Uint8Array {
        const pairs = hex.match(/.{1,2}/gu) ?? [];

        return Uint8Array.from(pairs.map((pair) => parseInt(pair, HEX_RADIX)));
    }

}