export declare enum CertificateHelperKeyType {
    rsa = "rsa",
    dsa = "dsa"
}
export type CertificateHelperKeyPair = {
    public: string;
    private: string;
};
export type CertificateHelperCertPair = {
    cert: string;
    privateKey: string;
};
export type CertificateHelperAttr = {
    name?: string;
    shortName?: string;
    value: string;
};
export declare class CertificateHelper {
    static generateKeyPair(modulusLength?: number, type?: CertificateHelperKeyType): Promise<CertificateHelperKeyPair>;
    static generateSshKeyPair(modulusLength?: number, type?: CertificateHelperKeyType, passphrase?: string): Promise<CertificateHelperKeyPair>;
    static generateCertificate(privateKey: string, publicKey: string, attrs: CertificateHelperAttr[], exts?: any[], validYears?: number, serialNumber?: string, signerPrivateKey?: string): Promise<CertificateHelperCertPair>;
}
