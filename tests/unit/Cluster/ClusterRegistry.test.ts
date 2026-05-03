import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import * as os from 'os';
import {ClusterRegistry} from '../../../src/Cluster/ClusterRegistry.js';
import {ClusterPublishable} from '../../../src/Cluster/ClusterPublishable.js';
import {IPCSharedStore} from '../../../src/SharedStore/IPCSharedStore.js';

class FakePublishable implements ClusterPublishable {

    public payload: any;
    public serializeCalls = 0;

    public constructor(private readonly _namespace: string, payload: any = {}) {
        this.payload = payload;
    }

    public getNamespace(): string {
        return this._namespace;
    }

    public serialize(): unknown {
        this.serializeCalls++;
        return this.payload;
    }

}

describe('ClusterRegistry (single-process via IPCSharedStore)', () => {

    let store: IPCSharedStore;
    let registry: ClusterRegistry;
    const workerId = `${os.hostname()}:${process.pid}`;

    beforeEach(async() => {
        store = new IPCSharedStore();
        await store.init();
        registry = new ClusterRegistry(store, { heartbeatMs: 50, ttlMs: 200 });
    });

    afterEach(async() => {
        await registry.stop();
    });

    it('writes a registered item to the store on start', async() => {
        const item = new FakePublishable('test-ns', { foo: 'bar' });
        registry.register(item);

        await registry.start();

        expect(item.serializeCalls).toBe(1);

        const own = await registry.queryOwn<{ foo: string; }>('test-ns');
        expect(own).toEqual({ foo: 'bar' });
    });

    it('queryAll returns workerId → state mapping', async() => {
        const item = new FakePublishable('queue', { depth: 5 });
        registry.register(item);
        await registry.start();

        const all = await registry.queryAll<{ depth: number; }>('queue');

        expect(all).toEqual({ [workerId]: { depth: 5 } });
    });

    it('queryAll returns empty when nothing is registered', async() => {
        await registry.start();
        const all = await registry.queryAll('nothing');
        expect(all).toEqual({});
    });

    it('does not register the same item twice', async() => {
        const item = new FakePublishable('once');
        registry.register(item);
        registry.register(item);

        await registry.start();

        // Only one serialize call from the initial tick.
        expect(item.serializeCalls).toBe(1);
    });

    it('unregister removes the entry from the store', async() => {
        const item = new FakePublishable('temp', { x: 1 });
        registry.register(item);
        await registry.start();

        expect(await registry.queryOwn('temp')).toEqual({ x: 1 });

        await registry.unregister(item);

        expect(await registry.queryOwn('temp')).toBeNull();
    });

    it('stop removes all entries written by this worker', async() => {
        registry.register(new FakePublishable('a', { v: 1 }));
        registry.register(new FakePublishable('b', { v: 2 }));
        await registry.start();

        expect(await registry.queryOwn('a')).toEqual({ v: 1 });
        expect(await registry.queryOwn('b')).toEqual({ v: 2 });

        await registry.stop();

        expect(await registry.queryOwn('a')).toBeNull();
        expect(await registry.queryOwn('b')).toBeNull();
    });

    it('heartbeat re-publishes on each tick', async() => {
        const item = new FakePublishable('beat');
        registry.register(item);

        await registry.start();
        expect(item.serializeCalls).toBe(1);

        // wait long enough for ~2 ticks (50ms heartbeat)
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 130);
        });

        expect(item.serializeCalls).toBeGreaterThanOrEqual(3);
    });

    it('async serialize is awaited', async() => {
        const item: ClusterPublishable = {
            getNamespace: (): string => 'async-ns',
            serialize: async(): Promise<{ ready: boolean; }> => {
                await Promise.resolve();
                return { ready: true };
            }
        };

        registry.register(item);
        await registry.start();

        expect(await registry.queryOwn('async-ns')).toEqual({ ready: true });
    });

    it('continues ticking when one item throws in serialize', async() => {
        const broken: ClusterPublishable = {
            getNamespace: (): string => 'broken',
            serialize: (): unknown => {
                throw new Error('boom');
            }
        };
        const ok = new FakePublishable('ok', { v: 1 });

        // suppress logger output
        const errorSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        registry.register(broken);
        registry.register(ok);
        await registry.start();

        expect(await registry.queryOwn('ok')).toEqual({ v: 1 });
        expect(await registry.queryOwn('broken')).toBeNull();

        errorSpy.mockRestore();
    });

});

describe('ClusterRegistry static helpers', () => {

    it('buildKey produces cluster:<namespace>:<workerId>', () => {
        expect(ClusterRegistry.buildKey('svc', 'host:42')).toBe('cluster:svc:host:42');
    });

    it('buildPrefix produces cluster:<namespace>:', () => {
        expect(ClusterRegistry.buildPrefix('svc')).toBe('cluster:svc:');
    });

});