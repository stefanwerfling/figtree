import * as crypto from 'crypto';

const PPK_MAC_KEY_SALT = 'putty-private-key-file-mac-key';
const SSH_RSA = 'ssh-rsa';
const BASE64_LINE_LENGTH = 64;
const HIGH_BIT = 0x80;

/**
 * Encodes RSA keys in the SSH formats (OpenSSH public key, PuTTY .ppk private key)
 * over Node's built-in crypto — the replacement for node-forge's forge.ssh.* in
 * {@link CertificateHelper}. RSA only (ssh-rsa), which is what the helper produces.
 */
export class SshKey {

    /**
     * Encode an RSA public key (PEM) as an OpenSSH authorized_keys line
     * (`ssh-rsa <base64> [comment]`).
     * @param {string} publicKeyPem - the RSA public key (SPKI PEM)
     * @param {string} comment - an optional trailing comment
     * @return {string}
     */
    public static publicKeyToOpenSSH(publicKeyPem: string, comment: string = ''): string {
        const jwk = crypto.createPublicKey(publicKeyPem).export({format: 'jwk'});
        const blob = SshKey._rsaPublicBlob(jwk);
        const encoded = Buffer.from(blob).toString('base64');

        return comment.length > 0 ? `${SSH_RSA} ${encoded} ${comment}` : `${SSH_RSA} ${encoded}`;
    }

    /**
     * Encode an RSA private key (PEM) as an unencrypted PuTTY .ppk (version 2)
     * private key. Encrypted .ppk (a non-empty passphrase) is intentionally not
     * supported — node-forge produced an unencrypted key for an empty passphrase,
     * which is the only case in use.
     * @param {string} privateKeyPem - the RSA private key (PKCS#8 PEM)
     * @param {string} passphrase - must be empty (encrypted keys unsupported)
     * @param {string} comment - the key comment
     * @return {string}
     */
    public static privateKeyToPuttyV2(
        privateKeyPem: string,
        passphrase: string = '',
        comment: string = ''
    ): string {
        if (passphrase.length > 0) {
            throw new Error('SshKey::privateKeyToPuttyV2: encrypted PuTTY keys are not supported');
        }

        const jwk = crypto.createPrivateKey(privateKeyPem).export({format: 'jwk'});
        const publicBlob = SshKey._rsaPublicBlob(jwk);

        // ssh-rsa private blob: private exponent, prime1, prime2, iqmp (q^-1 mod p).
        // JWK's qi is exactly q^-1 mod p, matching PuTTY's iqmp.
        const privateBlob = SshKey._concat([
            SshKey._mpint(SshKey._b64u(jwk.d)),
            SshKey._mpint(SshKey._b64u(jwk.p)),
            SshKey._mpint(SshKey._b64u(jwk.q)),
            SshKey._mpint(SshKey._b64u(jwk.qi))
        ]);

        // MAC (unencrypted v2): HMAC-SHA1 keyed with SHA1(salt) over the five
        // length-prefixed fields (alg, encryption, comment, public, private).
        const macKey = crypto.createHash('sha1').update(PPK_MAC_KEY_SALT).digest();
        const macData = SshKey._concat([
            SshKey._sshString(Buffer.from(SSH_RSA)),
            SshKey._sshString(Buffer.from('none')),
            SshKey._sshString(Buffer.from(comment)),
            SshKey._sshString(publicBlob),
            SshKey._sshString(privateBlob)
        ]);
        const mac = crypto.createHmac('sha1', macKey).update(macData).digest('hex');

        const publicLines = SshKey._base64Lines(publicBlob);
        const privateLines = SshKey._base64Lines(privateBlob);

        return [
            `PuTTY-User-Key-File-2: ${SSH_RSA}`,
            'Encryption: none',
            `Comment: ${comment}`,
            `Public-Lines: ${publicLines.length}`,
            ...publicLines,
            `Private-Lines: ${privateLines.length}`,
            ...privateLines,
            `Private-MAC: ${mac}`,
            ''
        ].join('\r\n');
    }

    /**
     * The ssh-rsa public blob (string "ssh-rsa", mpint e, mpint n) from a JWK.
     * @param {crypto.JsonWebKey} jwk - the RSA JWK
     * @return {Uint8Array}
     */
    private static _rsaPublicBlob(jwk: crypto.JsonWebKey): Uint8Array {
        return SshKey._concat([
            SshKey._sshString(Buffer.from(SSH_RSA)),
            SshKey._mpint(SshKey._b64u(jwk.e)),
            SshKey._mpint(SshKey._b64u(jwk.n))
        ]);
    }

    /**
     * Decode a base64url JWK field to bytes.
     * @param {string | undefined} value - the base64url value
     * @return {Uint8Array}
     */
    private static _b64u(value: string | undefined): Uint8Array {
        if (value === undefined) {
            throw new Error('SshKey: missing RSA key component');
        }

        return new Uint8Array(Buffer.from(value, 'base64url'));
    }

    /**
     * An SSH mpint: the big-endian magnitude with a leading 0x00 when the high bit
     * is set (so it stays non-negative), length-prefixed.
     * @param {Uint8Array} magnitude - the big-endian magnitude bytes
     * @return {Uint8Array}
     */
    private static _mpint(magnitude: Uint8Array): Uint8Array {
        let start = 0;

        while (start < magnitude.length - 1 && magnitude[start] === 0x00) {
            start += 1;
        }

        let value = magnitude.subarray(start);

        // eslint-disable-next-line no-bitwise
        if (value.length > 0 && (value[0] & HIGH_BIT) !== 0) {
            value = SshKey._concat([Uint8Array.of(0x00), value]);
        }

        return SshKey._sshString(value);
    }

    /**
     * An SSH string: a 4-byte big-endian length prefix followed by the bytes.
     * @param {Uint8Array} bytes - the content bytes
     * @return {Uint8Array}
     */
    private static _sshString(bytes: Uint8Array): Uint8Array {
        const length = new Uint8Array(4);
        new DataView(length.buffer).setUint32(0, bytes.length, false);

        return SshKey._concat([length, bytes]);
    }

    /**
     * Base64-encode bytes and wrap into 64-character lines.
     * @param {Uint8Array} bytes - the bytes to encode
     * @return {string[]}
     */
    private static _base64Lines(bytes: Uint8Array): string[] {
        const base64 = Buffer.from(bytes).toString('base64');

        return base64.match(new RegExp(`.{1,${BASE64_LINE_LENGTH}}`, 'gu')) ?? [''];
    }

    /**
     * Concatenate byte arrays.
     * @param {Uint8Array[]} parts - the byte arrays
     * @return {Uint8Array}
     */
    private static _concat(parts: Uint8Array[]): Uint8Array {
        const total = parts.reduce((sum, part) => sum + part.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;

        for (const part of parts) {
            out.set(part, offset);
            offset += part.length;
        }

        return out;
    }

}