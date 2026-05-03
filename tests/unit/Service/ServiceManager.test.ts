import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {ServiceManager} from '../../../src/Service/ServiceManager.js';
import {ServiceAbstract} from '../../../src/Service/ServiceAbstract.js';

class FakeService extends ServiceAbstract {

    public constructor(name: string) {
        super(name);
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