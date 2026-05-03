import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {ClusterLeader} from '../../../src/Cluster/ClusterLeader.js';
import {IPCSharedStore} from '../../../src/SharedStore/IPCSharedStore.js';

describe('ClusterLeader (single-process via IPCSharedStore)', () => {

    let store: IPCSharedStore;
    const leaders: ClusterLeader[] = [];

    beforeEach(async() => {
        store = new IPCSharedStore();
        await store.init();
        leaders.length = 0;
    });

    afterEach(async() => {
        for (const l of leaders) {
            // sequential cleanup — order is not significant but await is fine here
            // eslint-disable-next-line no-await-in-loop
            await l.stop();
        }
    });

    const track = (l: ClusterLeader): ClusterLeader => {
        leaders.push(l);
        return l;
    };

    it('elects the only candidate as leader', async() => {
        let elected = false;
        const leader = track(new ClusterLeader(store, {
            name: 'cron-1',
            ttlMs: 60_000,
            renewMs: 1000,
            retryMs: 1000
        }));
        leader.onLeaderElected(() => { elected = true; });

        await leader.start();

        expect(leader.isLeader()).toBe(true);
        expect(elected).toBe(true);
    });

    it('only one of two candidates becomes leader', async() => {
        const a = track(new ClusterLeader(store, {
            name: 'cron-2', ttlMs: 60_000, renewMs: 1000, retryMs: 1000
        }));
        const b = track(new ClusterLeader(store, {
            name: 'cron-2', ttlMs: 60_000, renewMs: 1000, retryMs: 1000
        }));

        await a.start();
        await b.start();

        const aLeader = a.isLeader();
        const bLeader = b.isLeader();

        expect(aLeader || bLeader).toBe(true);
        expect(aLeader && bLeader).toBe(false);
    });

    it('fires onLeaderLost when the leader stops', async() => {
        let lost = false;
        const leader = track(new ClusterLeader(store, {
            name: 'cron-3', ttlMs: 60_000, renewMs: 1000, retryMs: 1000
        }));
        leader.onLeaderLost(() => { lost = true; });

        await leader.start();
        expect(leader.isLeader()).toBe(true);

        await leader.stop();
        expect(leader.isLeader()).toBe(false);
        expect(lost).toBe(true);
    });

    it('a waiting candidate takes over after the leader stops', async() => {
        const a = track(new ClusterLeader(store, {
            name: 'cron-4', ttlMs: 60_000, renewMs: 1000, retryMs: 50
        }));
        const b = track(new ClusterLeader(store, {
            name: 'cron-4', ttlMs: 60_000, renewMs: 1000, retryMs: 50
        }));

        await a.start();
        expect(a.isLeader()).toBe(true);
        expect(b.isLeader()).toBe(false);

        await b.start();
        await a.stop();

        // Allow b's retry interval to fire and acquire.
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 150);
        });

        expect(b.isLeader()).toBe(true);
    });

    it('start is idempotent', async() => {
        const leader = track(new ClusterLeader(store, {
            name: 'cron-5', ttlMs: 60_000, renewMs: 1000, retryMs: 1000
        }));

        await leader.start();
        // second call is a no-op
        await leader.start();

        expect(leader.isLeader()).toBe(true);
    });

    it('callback errors do not break the election loop', async() => {
        const leader = track(new ClusterLeader(store, {
            name: 'cron-6', ttlMs: 60_000, renewMs: 1000, retryMs: 1000
        }));

        leader.onLeaderElected(() => {
            throw new Error('boom');
        });

        await leader.start();
        expect(leader.isLeader()).toBe(true);
    });

});