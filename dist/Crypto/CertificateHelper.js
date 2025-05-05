import * as crypto from 'crypto';
import forge from 'node-forge';
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
        }
        return {
            public: keys ? keys.publicKey : '',
            private: keys ? keys.privateKey : ''
        };
    }
    static async generateSshKeyPair(modulusLength = 4096, type = CertificateHelperKeyType.rsa, passphrase = '') {
        const keys = await CertificateHelper.generateKeyPair(modulusLength, type);
        const prKey = forge.pki.privateKeyFromPem(keys.private);
        const pubKey = forge.pki.publicKeyFromPem(keys.public);
        return {
            private: forge.ssh.privateKeyToPutty(prKey, passphrase, ''),
            public: forge.ssh.publicKeyToOpenSSH(pubKey, '')
        };
    }
    static async generateCertificate(privateKey, publicKey, attrs, exts = [], validYears = 1, serialNumber = '01', signerPrivateKey = '') {
        const prKey = forge.pki.privateKeyFromPem(privateKey);
        const pubKey = forge.pki.publicKeyFromPem(publicKey);
        const cert = forge.pki.createCertificate();
        cert.publicKey = pubKey;
        cert.serialNumber = serialNumber;
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + validYears);
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        if (exts.length > 0) {
            cert.setExtensions(exts);
        }
        if (signerPrivateKey === '') {
            cert.sign(prKey);
        }
        else {
            const sigPrKey = forge.pki.privateKeyFromPem(signerPrivateKey);
            cert.sign(sigPrKey);
        }
        return {
            privateKey: forge.pki.privateKeyToPem(prKey),
            cert: forge.pki.certificateToPem(cert)
        };
    }
}
//# sourceMappingURL=CertificateHelper.js.map