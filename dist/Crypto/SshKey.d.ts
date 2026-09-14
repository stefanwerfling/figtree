export declare class SshKey {
    static publicKeyToOpenSSH(publicKeyPem: string, comment?: string): string;
    static privateKeyToPuttyV2(privateKeyPem: string, passphrase?: string, comment?: string): string;
    private static _rsaPublicBlob;
    private static _b64u;
    private static _mpint;
    private static _sshString;
    private static _base64Lines;
    private static _concat;
}
