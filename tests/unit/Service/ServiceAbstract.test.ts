import {ServiceStatus} from 'figtree-schemas';
import {describe, it, expect} from 'vitest';
import {ServiceAbstract} from '../../../src/Service/ServiceAbstract.js';

/**
 * Subclass that exposes `_status` so tests can drive the status
 * transitions the default `healthCheck()` is expected to reflect.
 */
class FakeService extends ServiceAbstract {

    public constructor(name: string) {
        super(name);
    }

    public setStatusForTest(status: ServiceStatus): void {
        this._status = status;
    }

}

describe('ServiceAbstract.healthCheck (default)', () => {

    it('returns true once status is Success', async() => {
        const svc = new FakeService('a');
        svc.setStatusForTest(ServiceStatus.Success);

        await expect(svc.healthCheck()).resolves.toBe(true);
    });

    it('returns false when status is None (untouched)', async() => {
        const svc = new FakeService('a');

        await expect(svc.healthCheck()).resolves.toBe(false);
    });

    it('returns false when status is Progress (start in flight)', async() => {
        const svc = new FakeService('a');
        svc.setStatusForTest(ServiceStatus.Progress);

        await expect(svc.healthCheck()).resolves.toBe(false);
    });

    it('returns false when status is Error', async() => {
        const svc = new FakeService('a');
        svc.setStatusForTest(ServiceStatus.Error);

        await expect(svc.healthCheck()).resolves.toBe(false);
    });

});

describe('ServiceAbstract.markUnhealthy', () => {

    it('flips status from Success to Error and stores the reason', () => {
        const svc = new FakeService('a');
        svc.setStatusForTest(ServiceStatus.Success);

        svc.markUnhealthy('probe failed');

        expect(svc.getStatus()).toBe(ServiceStatus.Error);
        expect(svc.getStatusMsg()).toBe('probe failed');
    });

});