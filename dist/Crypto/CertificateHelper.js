import * as crypto from 'crypto';
import { SshKey } from './SshKey.js';
import { X509Rsa } from './X509Rsa.js';
export var CertificateHelperKeyType;
(function (CertificateHelperKeyType) {
    CertificateHelperKeyType["rsa"] = "rsa";
    CertificateHelperKeyType["dsa"] = "dsa";
})(CertificateHelperKeyType || (CertificateHelperKeyType = {}));
export class CertificateHelper {
    static async generateKeyPair(modulusLength = 4096, type = CertificateHelperKeyType.rsa) {
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
                keys = crypto.generateKeyPairSync('rsa', options);
                break;
            case CertificateHelperKeyType.dsa:
                keys = crypto.generateKeyPairSync('dsa', options);
                break;
            default:
                throw new Error(`CertificateHelper::generateKeyPair: Unsupported key type: ${type}`);
        }
        return {
            public: keys.publicKey,
            private: keys.privateKey
        };
    }
    static async generateSshKeyPair(modulusLength = 4096, type = CertificateHelperKeyType.rsa, passphrase = '') {
        const keys = await CertificateHelper.generateKeyPair(modulusLength, type);
        return {
            private: SshKey.privateKeyToPuttyV2(keys.private, passphrase, ''),
            public: SshKey.publicKeyToOpenSSH(keys.public, '')
        };
    }
    static async generateCertificate(privateKey, publicKey, attrs, exts = [], validYears = 1, serialNumber = '01', signerPrivateKey = '') {
        const cert = X509Rsa.createCertificate({
            subjectPublicKeyPem: publicKey,
            signingKeyPem: signerPrivateKey === '' ? privateKey : signerPrivateKey,
            attrs: attrs,
            exts: exts,
            validYears: validYears,
            serialNumberHex: serialNumber
        });
        return {
            privateKey: crypto.createPrivateKey(privateKey).export({ type: 'pkcs1', format: 'pem' }),
            cert: cert
        };
    }
}
//# sourceMappingURL=CertificateHelper.js.map