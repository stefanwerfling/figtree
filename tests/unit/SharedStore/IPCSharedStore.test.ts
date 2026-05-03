import {describe, it, expect, beforeEach} from 'vitest';
import {IPCSharedStore} from '../../../src/SharedStore/IPCSharedStore.js';

/**
 * In single-process tests we run as cluster.isPrimary === true with no workers,
 * so publish() falls into the `_fanOutPublish` branch and dispatches directly
 * to local subscribers — exactly what we want to assert.
 */
describe('IPCSharedStore Pub/Sub (single-process)', () => {

    let store: IPCSharedStore;

    beforeEach(async() => {
        store = new IPCSharedStore();
        await store.init();
    });

    it('delivers a published message to a local subscriber', async() => {
        const received: any[] = [];

        await store.subscribe<string>('hello', (msg) => {
            received.push(msg);
        });

        await store.publish('hello', 'world');

        expect(received).toEqual(['world']);
    });

    it('delivers to multiple subscribers on the same channel', async() => {
        const a: any[] = [];
        const b: any[] = [];

        await store.subscribe('events', (m) => a.push(m));
        await store.subscribe('events', (m) => b.push(m));

        await store.publish('events', { id: 1 });

        expect(a).toEqual([{ id: 1 }]);
        expect(b).toEqual([{ id: 1 }]);
    });

    it('does not deliver across channels', async() => {
        const received: any[] = [];

        await store.subscribe('only-this', (m) => received.push(m));
        await store.publish('other', 'x');

        expect(received).toEqual([]);
    });

    it('removes a single subscriber via unsubscribe(channel, callback)', async() => {
        const a: any[] = [];
        const b: any[] = [];

        const cbA = (m: any): void => { a.push(m); };
        const cbB = (m: any): void => { b.push(m); };

        await store.subscribe('ch', cbA);
        await store.subscribe('ch', cbB);

        await store.unsubscribe('ch', cbA);
        await store.publish('ch', 'msg');

        expect(a).toEqual([]);
        expect(b).toEqual(['msg']);
    });

    it('removes all subscribers via unsubscribe(channel)', async() => {
        const received: any[] = [];

        await store.subscribe('ch', (m) => received.push(m));
        await store.subscribe('ch', (m) => received.push(m));

        await store.unsubscribe('ch');
        await store.publish('ch', 'msg');

        expect(received).toEqual([]);
    });

    it('handles async subscribers (errors are swallowed and logged)', async() => {
        const received: any[] = [];

        await store.subscribe<string>('ch', async(m) => {
            await Promise.resolve();
            received.push(m);
        });

        await store.publish('ch', 'async-ok');

        // Allow microtasks to settle
        await new Promise<void>((resolve) => {
            setImmediate(resolve);
        });

        expect(received).toEqual(['async-ok']);
    });

    it('isolates exceptions in one subscriber from others', async() => {
        const received: any[] = [];

        await store.subscribe('ch', () => {
            throw new Error('boom');
        });
        await store.subscribe('ch', (m) => {
            received.push(m);
        });

        await store.publish('ch', 'survives');

        expect(received).toEqual(['survives']);
    });

});