import {DSAKeyPairOptions, RSAKeyPairOptions} from 'crypto';
import * as crypto from 'crypto';
import {SshKey} from './SshKey.js';
import {X509Rsa, X509RsaExt} from './X509Rsa.js';

/**
 * CertificateHelperKeyType
 */
export enum CertificateHelperKeyType {
    rsa = 'rsa',
    dsa = 'dsa'
}

/**
 * CertificateHelperKeyPair
 */
export type CertificateHelperKeyPair = {
    public: string;
    private: string;
};

/**
 * CertificateHelperCertPair
 */
export type CertificateHelperCertPair = {
    cert: string;
    privateKey: string;
};

/**
 * CertificateHelperAttr
 */
export type CertificateHelperAttr = {
    name?: string;
    shortName?: string;
    value: string;
};

/**
 * CertificateHelper
 */
export class CertificateHelper {

    /**
     * Generate KeyPair
     * @param {number} modulusLength
     * @param {CertificateHelperKeyType} type
     * @return {CertificateHelperKeyPair}
     */
    public static async generateKeyPair(
        modulusLength: number = 4096,
        type: CertificateHelperKeyType = CertificateHelperKeyType.rsa
    ): Promise<CertificateHelperKeyPair> {
        const options = {
            modulusLength: modulusLength,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        };

        let keys;

        switch (type) {
            case CertificateHelperKeyType.rsa:
                keys = crypto.generateKeyPairSync('rsa', options as RSAKeyPairOptions<'pem', 'pem'>);
                break;

            case CertificateHelperKeyType.dsa:
                keys = crypto.generateKeyPairSync('dsa', options as DSAKeyPairOptions<'pem', 'pem'>);
                break;

            default:
                throw new Error(`CertificateHelper::generateKeyPair: Unsupported key type: ${type}`);
        }

        return {
            public: keys.publicKey,
            private: keys.privateKey
        };
    }

    /**
     * Generate Ssh KeyPair
     * @param {number} modulusLength
     * @param {CertificateHelperKeyType} type
     * @param {string} passphrase
     * @return {CertificateHelperKeyPair}
     */
    public static async generateSshKeyPair(
        modulusLength: number = 4096,
        type: CertificateHelperKeyType = CertificateHelperKeyType.rsa,
        passphrase: string = ''
    ): Promise<CertificateHelperKeyPair> {
        const keys = await CertificateHelper.generateKeyPair(modulusLength, type);

        return {
            private: SshKey.privateKeyToPuttyV2(keys.private, passphrase, ''),
            public: SshKey.publicKeyToOpenSSH(keys.public, '')
        };
    }

    /**
     * generate Certificate
     * @param {string} privateKey
     * @param {string} publicKey
     * @param {CertificateHelperAttr[]} attrs
     * @param {any[]} exts
     * @param {number} validYears
     * @param {string} serialNumber
     * @param {string} signerPrivateKey
     * @return {CertificateHelperCertPair}
     */
    public static async generateCertificate(
        privateKey: string,
        publicKey: string,
        attrs: CertificateHelperAttr[],
        exts: any[] = [],
        validYears: number = 1,
        serialNumber: string = '01',
        signerPrivateKey: string = ''
    ): Promise<CertificateHelperCertPair> {
        const cert = X509Rsa.createCertificate({
            subjectPublicKeyPem: publicKey,
            signingKeyPem: signerPrivateKey === '' ? privateKey : signerPrivateKey,
            attrs: attrs,
            exts: exts as X509RsaExt[],
            validYears: validYears,
            serialNumberHex: serialNumber
        });

        return {
            privateKey: crypto.createPrivateKey(privateKey).export({type: 'pkcs1', format: 'pem'}) as string,
            cert: cert
        };
    }

}