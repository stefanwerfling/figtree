import * as crypto from 'crypto';
const PPK_MAC_KEY_SALT = 'putty-private-key-file-mac-key';
const SSH_RSA = 'ssh-rsa';
const BASE64_LINE_LENGTH = 64;
const HIGH_BIT = 0x80;
export class SshKey {
    static publicKeyToOpenSSH(publicKeyPem, comment = '') {
        const jwk = crypto.createPublicKey(publicKeyPem).export({ format: 'jwk' });
        const blob = SshKey._rsaPublicBlob(jwk);
        const encoded = Buffer.from(blob).toString('base64');
        return comment.length > 0 ? `${SSH_RSA} ${encoded} ${comment}` : `${SSH_RSA} ${encoded}`;
    }
    static privateKeyToPuttyV2(privateKeyPem, passphrase = '', comment = '') {
        if (passphrase.length > 0) {
            throw new Error('SshKey::privateKeyToPuttyV2: encrypted PuTTY keys are not supported');
        }
        const jwk = crypto.createPrivateKey(privateKeyPem).export({ format: 'jwk' });
        const publicBlob = SshKey._rsaPublicBlob(jwk);
        const privateBlob = SshKey._concat([
            SshKey._mpint(SshKey._b64u(jwk.d)),
            SshKey._mpint(SshKey._b64u(jwk.p)),
            SshKey._mpint(SshKey._b64u(jwk.q)),
            SshKey._mpint(SshKey._b64u(jwk.qi))
        ]);
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
    static _rsaPublicBlob(jwk) {
        return SshKey._concat([
            SshKey._sshString(Buffer.from(SSH_RSA)),
            SshKey._mpint(SshKey._b64u(jwk.e)),
            SshKey._mpint(SshKey._b64u(jwk.n))
        ]);
    }
    static _b64u(value) {
        if (value === undefined) {
            throw new Error('SshKey: missing RSA key component');
        }
        return new Uint8Array(Buffer.from(value, 'base64url'));
    }
    static _mpint(magnitude) {
        let start = 0;
        while (start < magnitude.length - 1 && magnitude[start] === 0x00) {
            start += 1;
        }
        let value = magnitude.subarray(start);
        if (value.length > 0 && (value[0] & HIGH_BIT) !== 0) {
            value = SshKey._concat([Uint8Array.of(0x00), value]);
        }
        return SshKey._sshString(value);
    }
    static _sshString(bytes) {
        const length = new Uint8Array(4);
        new DataView(length.buffer).setUint32(0, bytes.length, false);
        return SshKey._concat([length, bytes]);
    }
    static _base64Lines(bytes) {
        const base64 = Buffer.from(bytes).toString('base64');
        return base64.match(new RegExp(`.{1,${BASE64_LINE_LENGTH}}`, 'gu')) ?? [''];
    }
    static _concat(parts) {
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
//# sourceMappingURL=SshKey.js.map