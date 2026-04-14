import {describe, it, expect} from 'vitest';
import {CertificateHelper, CertificateHelperKeyType} from '../../../src/Crypto/CertificateHelper.js';

describe('CertificateHelper.generateKeyPair', () => {

    it('generates a valid RSA key pair', async() => {
        const pair = await CertificateHelper.generateKeyPair(1024, CertificateHelperKeyType.rsa);
        expect(pair.public).toContain('-----BEGIN PUBLIC KEY-----');
        expect(pair.private).toContain('-----BEGIN PRIVATE KEY-----');
    });

    it('throws for unsupported key type', async() => {
        await expect(
            CertificateHelper.generateKeyPair(1024, 'ed25519' as CertificateHelperKeyType)
        ).rejects.toThrow('Unsupported key type');
    });

});

describe('CertificateHelper.generateCertificate', () => {

    it('generates a self-signed certificate', async() => {
        const pair = await CertificateHelper.generateKeyPair(1024, CertificateHelperKeyType.rsa);

        const cert = await CertificateHelper.generateCertificate(
            pair.private,
            pair.public,
            [{name: 'commonName', value: 'test'}]
        );

        expect(cert.cert).toContain('-----BEGIN CERTIFICATE-----');
        expect(cert.privateKey).toContain('-----BEGIN RSA PRIVATE KEY-----');
    });

}, 30_000);