import {describe, it, expect, beforeEach} from 'vitest';
import {IPCSharedStore} from '../../../src/SharedStore/IPCSharedStore.js';

describe('IPCSharedStore.createLease (single-process)', () => {

    let store: IPCSharedStore;

    beforeEach(async() => {
        store = new IPCSharedStore();
        await store.init();
    });

    it('acquire returns true when the lease is free', async() => {
        const lease = store.createLease('lease-1', { ttlMs: 60_000 });
        expect(await lease.acquire()).toBe(true);
        expect(lease.isHolder()).toBe(true);
    });

    it('a second lease cannot acquire while the first is held', async() => {
        const a = store.createLease('shared', { ttlMs: 60_000 });
        const b = store.createLease('shared', { ttlMs: 60_000 });

        expect(await a.acquire()).toBe(true);
        expect(await b.acquire()).toBe(false);

        expect(a.isHolder()).toBe(true);
        expect(b.isHolder()).toBe(false);
    });

    it('a second lease can acquire after the first releases', async() => {
        const a = store.createLease('shared', { ttlMs: 60_000 });
        const b = store.createLease('shared', { ttlMs: 60_000 });

        await a.acquire();
        expect(await a.release()).toBe(true);
        expect(a.isHolder()).toBe(false);

        expect(await b.acquire()).toBe(true);
    });

    it('a second lease can acquire after the first lease expires', async() => {
        const a = store.createLease('expiring', { ttlMs: 50 });
        const b = store.createLease('expiring', { ttlMs: 60_000 });

        expect(await a.acquire()).toBe(true);

        // wait past TTL
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 80);
        });

        expect(await b.acquire()).toBe(true);
    });

    it('renew succeeds while we are the holder', async() => {
        const lease = store.createLease('renew', { ttlMs: 60_000 });

        await lease.acquire();
        expect(await lease.renew()).toBe(true);
        expect(lease.isHolder()).toBe(true);
    });

    it('renew fails after the lease expired and another acquired', async() => {
        const a = store.createLease('takeover', { ttlMs: 50 });
        const b = store.createLease('takeover', { ttlMs: 60_000 });

        await a.acquire();

        await new Promise<void>((resolve) => {
            setTimeout(resolve, 80);
        });

        await b.acquire();

        expect(await a.renew()).toBe(false);
        expect(a.isHolder()).toBe(false);
    });

    it('renew on a non-holder returns false without contacting the store', async() => {
        const lease = store.createLease('not-held', { ttlMs: 60_000 });
        expect(await lease.renew()).toBe(false);
    });

    it('release on a non-holder returns false', async() => {
        const lease = store.createLease('not-held', { ttlMs: 60_000 });
        expect(await lease.release()).toBe(false);
    });

    it('release does not delete the lease of another holder', async() => {
        const a = store.createLease('protected', { ttlMs: 60_000 });
        const b = store.createLease('protected', { ttlMs: 60_000 });

        await a.acquire();
        expect(await b.release()).toBe(false);
        // a should still be the holder server-side
        expect(await a.renew()).toBe(true);
    });

    it('getName returns the lease name', () => {
        const lease = store.createLease('my-lease');
        expect(lease.getName()).toBe('my-lease');
    });

});