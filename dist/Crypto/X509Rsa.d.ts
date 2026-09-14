export type X509RsaAttr = {
    name?: string;
    shortName?: string;
    value: string;
};
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
    altNames?: {
        type: number;
        value: string;
    }[];
};
export type X509RsaCertOptions = {
    subjectPublicKeyPem: string;
    signingKeyPem: string;
    attrs: X509RsaAttr[];
    exts: X509RsaExt[];
    validYears: number;
    serialNumberHex: string;
};
export declare class X509Rsa {
    static createCertificate(options: X509RsaCertOptions): string;
    private static _name;
    private static _extension;
    private static _encodeExtension;
    private static _basicConstraints;
    private static _keyUsage;
    private static _extKeyUsage;
    private static _subjectAltName;
    private static _ipv4;
    private static _time;
    private static _pemToDer;
    private static _derToPem;
    private static _hexToBytes;
}
