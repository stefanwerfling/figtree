import {describe, it, expect} from 'vitest';
import {createBruteForceProtection} from '../../../src/Server/HttpServer/Routes/BruteForceProtection.js';

describe('createBruteForceProtection', () => {

    it('returns a request handler function', () => {
        const handler = createBruteForceProtection();
        expect(typeof handler).toBe('function');
    });

    it('returns a request handler with custom options', () => {
        const handler = createBruteForceProtection({limit: 5, windowMs: 60_000});
        expect(typeof handler).toBe('function');
    });

    it('returns a request handler with custom message', () => {
        const handler = createBruteForceProtection({message: 'Too many requests'});
        expect(typeof handler).toBe('function');
    });

});