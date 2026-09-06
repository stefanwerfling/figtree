import {describe, it, expect, afterEach} from 'vitest';
import fs from 'node:fs/promises';
import {X509Certificate} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {HttpServer} from '../../../src/Server/HttpServer/HttpServer.js';
import {BaseHttpCertKey, BaseHttpServerOptionCrypt, BaseHttpServerOptions} from '../../../src/Server/HttpServer/BaseHttpServer.js';

/**
 * Exposes the protected `_getCertAndKey` for testing.
 */
class TestableHttpServer extends HttpServer {

    public constructor() {
        super({realm: 'test'} as unknown as BaseHttpServerOptions);
    }

    public getCertAndKey(options: BaseHttpServerOptionCrypt): Promise<BaseHttpCertKey|null> {
        return this._getCertAndKey(options);
    }

}

describe('HttpServer::_getCertAndKey', () => {
    const tmpDirs: string[] = [];

    afterEach(async() => {
        while (tmpDirs.length > 0) {
            const dir = tmpDirs.pop()!;
            await fs.rm(dir, {recursive: true, force: true});
        }
    });

    it('persists a generated temporary certificate to sslPath and reuses it on the next call', async() => {
        const sslPath = await fs.mkdtemp(path.join(os.tmpdir(), 'figtree-ssl-'));
        tmpDirs.push(sslPath);

        const server = new TestableHttpServer();

        const first = await server.getCertAndKey({sslPath, key: 'server.pem', crt: 'server.crt'});
        const second = await server.getCertAndKey({sslPath, key: 'server.pem', crt: 'server.crt'});

        expect(first).not.toBeNull();
        expect(second).toEqual(first);

        const persistedKey = await fs.readFile(path.join(sslPath, 'server.pem'), 'utf8');
        const persistedCrt = await fs.readFile(path.join(sslPath, 'server.crt'), 'utf8');

        expect(persistedKey).toBe(first!.key);
        expect(persistedCrt).toBe(first!.crt);
    }, 30_000);

    it('includes the machine hostname in the generated certificate\'s subjectAltName', async() => {
        const server = new TestableHttpServer();

        const ck = await server.getCertAndKey({sslPath: '', key: '', crt: ''});
        const cert = new X509Certificate(ck!.crt);

        expect(cert.subjectAltName).toContain(`DNS:${os.hostname()}`);
        expect(cert.subjectAltName).toContain('DNS:localhost');
    }, 30_000);

    it('generates a fresh in-memory certificate every call when no sslPath is set', async() => {
        const server = new TestableHttpServer();

        const first = await server.getCertAndKey({sslPath: '', key: '', crt: ''});
        const second = await server.getCertAndKey({sslPath: '', key: '', crt: ''});

        expect(first).not.toBeNull();
        expect(second).not.toBeNull();
        expect(second!.crt).not.toBe(first!.crt);
    }, 30_000);

});
