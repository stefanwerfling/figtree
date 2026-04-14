import {describe, it, expect, beforeEach} from 'vitest';
import {RequestContext} from '../../../src/Server/HttpServer/Routes/RequestContext.js';

beforeEach(() => {
    // reset singleton between tests
    (RequestContext as any)._instance = null;
});

describe('RequestContext singleton', () => {

    it('hasInstance returns false before first access', () => {
        expect(RequestContext.hasInstance()).toBe(false);
    });

    it('getInstance creates an instance', () => {
        const ctx = RequestContext.getInstance();
        expect(ctx).toBeDefined();
        expect(RequestContext.hasInstance()).toBe(true);
    });

    it('getInstance returns the same instance', () => {
        const a = RequestContext.getInstance();
        const b = RequestContext.getInstance();
        expect(a).toBe(b);
    });

});

describe('RequestContext get/set', () => {

    it('get returns undefined outside of a context', () => {
        const ctx = RequestContext.getInstance();
        expect(ctx.get('key')).toBeUndefined();
    });

    it('runWithContext provides values via get', () => new Promise<void>((resolve) => {
        const ctx = RequestContext.getInstance();
        const data: Map<string, unknown> = new Map([['sessionid', 'abc123']]);

        ctx.runWithContext(data, () => {
            expect(ctx.get<string>(RequestContext.SESSIONID)).toBe('abc123');
            resolve();
        });
    }));

    it('set updates a value within an active context', () => new Promise<void>((resolve) => {
        const ctx = RequestContext.getInstance();
        const data: Map<string, unknown> = new Map();

        ctx.runWithContext(data, () => {
            ctx.set(RequestContext.USERID, 42);
            expect(ctx.get<number>(RequestContext.USERID)).toBe(42);
            resolve();
        });
    }));

    it('set is a no-op outside of a context', () => {
        const ctx = RequestContext.getInstance();
        // should not throw
        expect(() => ctx.set('key', 'value')).not.toThrow();
    });

});