/* eslint-disable max-classes-per-file */
import {ServiceImportance, ServiceStatus} from 'figtree-schemas';
import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {ServiceManager} from '../../../src/Service/ServiceManager.js';
import {ServiceAbstract} from '../../../src/Service/ServiceAbstract.js';

class FakeService extends ServiceAbstract {

    public constructor(name: string, dependencies?: string[]) {
        super(name, dependencies);
    }

}

/**
 * Service whose start() always fails — used to verify the bounded
 * waiting loop in `startAll()` exits even when a dep stays in Error.
 */
class AlwaysFailingService extends ServiceAbstract {

    protected override readonly _importance: ServiceImportance = ServiceImportance.Important;

    public constructor(name: string) {
        super(name);
    }

    public override async start(): Promise<void> {
        this._status = ServiceStatus.Error;
        throw new Error('boom');
    }

}

describe('ServiceManager.add (role filter)', () => {

    const originalRole = process.env.WORKER_ROLE;

    beforeEach(() => {
        delete process.env.WORKER_ROLE;
    });

    afterEach(() => {
        if (originalRole === undefined) {
            delete process.env.WORKER_ROLE;
        } else {
            process.env.WORKER_ROLE = originalRole;
        }
    });

    it('adds a service without role filter regardless of WORKER_ROLE', () => {
        const mgr = new ServiceManager();
        mgr.add(new FakeService('a'));

        process.env.WORKER_ROLE = 'http';
        mgr.add(new FakeService('b'));

        expect(mgr.getByName('a')).not.toBeNull();
        expect(mgr.getByName('b')).not.toBeNull();
    });

    it('adds a service when WORKER_ROLE matches the filter', () => {
        process.env.WORKER_ROLE = 'http';
        const mgr = new ServiceManager();
        mgr.add(new FakeService('http-svc'), ['http']);

        expect(mgr.getByName('http-svc')).not.toBeNull();
    });

    it('skips a service when WORKER_ROLE does not match the filter', () => {
        process.env.WORKER_ROLE = 'cron';
        const mgr = new ServiceManager();
        mgr.add(new FakeService('http-svc'), ['http']);

        expect(mgr.getByName('http-svc')).toBeNull();
    });

    it('adds a service when filter contains multiple roles and one matches', () => {
        process.env.WORKER_ROLE = 'cron';
        const mgr = new ServiceManager();
        mgr.add(new FakeService('multi'), ['http', 'cron']);

        expect(mgr.getByName('multi')).not.toBeNull();
    });

    it('adds a service in single-process mode (WORKER_ROLE unset) even when filter is set', () => {
        const mgr = new ServiceManager();
        mgr.add(new FakeService('only-cron'), ['cron']);

        expect(mgr.getByName('only-cron')).not.toBeNull();
    });

    it('treats an empty roles array as "no filter"', () => {
        process.env.WORKER_ROLE = 'cron';
        const mgr = new ServiceManager();
        mgr.add(new FakeService('open'), []);

        expect(mgr.getByName('open')).not.toBeNull();
    });

});

describe('ServiceManager (ClusterPublishable)', () => {

    it('exposes the cluster namespace "service-manager"', () => {
        const mgr = new ServiceManager();
        expect(mgr.getNamespace()).toBe('service-manager');
    });

    it('serialize() returns the same payload as getInfoList()', () => {
        const mgr = new ServiceManager();
        mgr.add(new FakeService('a'));
        mgr.add(new FakeService('b'));

        expect(mgr.serialize()).toEqual(mgr.getInfoList());
    });

    it('serialize() returns an empty list when no services are registered', () => {
        const mgr = new ServiceManager();
        expect(mgr.serialize()).toEqual([]);
    });

});

describe('ServiceManager.startAll (bounded waiting loop)', () => {

    it('exits within the configured timeout when a dep stays in Error', async() => {
        // 200ms ceiling so the test stays snappy. AlwaysFailingService
        // never reaches Success, so the dependent service `consumer`
        // would block forever under the old infinite-loop semantics.
        const mgr = new ServiceManager({startAllTimeoutMs: 200});
        mgr.add(new AlwaysFailingService('flaky'));
        mgr.add(new FakeService('consumer', ['flaky']));

        const t0 = Date.now();
        await mgr.startAll();
        const elapsed = Date.now() - t0;

        // The bounded loop should give up within a sane margin of the
        // configured timeout. We allow 1.5s of slack for slow CI hosts.
        expect(elapsed).toBeLessThan(1700);
        expect(mgr.getByName('flaky')!.getStatus()).toBe(ServiceStatus.Error);
        expect(mgr.getByName('consumer')!.getStatus()).toBe(ServiceStatus.None);
    });

});