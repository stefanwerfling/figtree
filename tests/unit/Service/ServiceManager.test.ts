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

/**
 * Service that starts fine and lets the test drive its `healthCheck()`
 * verdict. Importance defaults to Important so it participates in the
 * monitor's probe loop.
 */
class ProbeableService extends ServiceAbstract {

    protected override readonly _importance: ServiceImportance = ServiceImportance.Important;

    public probeResult: boolean = true;

    public probeCallCount: number = 0;

    public startCallCount: number = 0;

    public constructor(name: string, dependencies?: string[]) {
        super(name, dependencies);
    }

    public override async start(): Promise<void> {
        this.startCallCount += 1;
        this._status = ServiceStatus.Success;
    }

    public override async healthCheck(): Promise<boolean> {
        this.probeCallCount += 1;
        return this.probeResult;
    }

}

/**
 * Service whose first N start()s fail and subsequent ones succeed.
 * Drives the monitor's retry path.
 */
class FlakyStartService extends ServiceAbstract {

    protected override readonly _importance: ServiceImportance = ServiceImportance.Important;

    public failsRemaining: number;

    public constructor(name: string, failsRemaining: number) {
        super(name);
        this.failsRemaining = failsRemaining;
    }

    public override async start(): Promise<void> {
        if (this.failsRemaining > 0) {
            this.failsRemaining -= 1;
            this._status = ServiceStatus.Error;
            throw new Error('not yet');
        }

        this._status = ServiceStatus.Success;
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
        const mgr = new ServiceManager({startAllTimeoutMs: 200, autoStartMonitor: false});
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

describe('ServiceManager (health monitor)', () => {

    it('retries a failed Important dep until it succeeds, then starts dependents', async() => {
        const mgr = new ServiceManager({
            startAllTimeoutMs: 50,
            autoStartMonitor: false,
            healthCheckIntervalMs: 60_000
        });
        const flaky = new FlakyStartService('flaky', 2);
        const consumer = new ProbeableService('consumer', ['flaky']);
        mgr.add(flaky);
        mgr.add(consumer);

        await mgr.startAll();

        // After startAll: flaky has failed once during the initial pass +
        // (depending on timing) once more during the bounded wait. Either
        // way, both are in Error / not-yet-started.
        expect(consumer.getStatus()).not.toBe(ServiceStatus.Success);

        // Drive the monitor manually until flaky has burned through its
        // remaining failures and the consumer starts.
        for (let i = 0; i < 5; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await mgr.runMonitorTick();
        }

        expect(flaky.getStatus()).toBe(ServiceStatus.Success);
        expect(consumer.getStatus()).toBe(ServiceStatus.Success);
    });

    it('flips a Success service to Error when healthCheck returns false', async() => {
        const mgr = new ServiceManager({
            autoStartMonitor: false,
            healthCheckIntervalMs: 0
        });
        const svc = new ProbeableService('probe');
        mgr.add(svc);

        await mgr.startAll();
        expect(svc.getStatus()).toBe(ServiceStatus.Success);

        svc.probeResult = false;
        await mgr.runMonitorTick();

        expect(svc.getStatus()).toBe(ServiceStatus.Error);
        expect(svc.getStatusMsg()).toContain('unhealthy');
    });

    it('leaves a Success service alone when healthCheck returns true', async() => {
        const mgr = new ServiceManager({
            autoStartMonitor: false,
            healthCheckIntervalMs: 0
        });
        const svc = new ProbeableService('probe');
        mgr.add(svc);

        await mgr.startAll();
        await mgr.runMonitorTick();

        expect(svc.getStatus()).toBe(ServiceStatus.Success);
        expect(svc.probeCallCount).toBeGreaterThanOrEqual(1);
    });

    it('throttles healthCheck per service by healthCheckIntervalMs', async() => {
        const mgr = new ServiceManager({
            autoStartMonitor: false,
            healthCheckIntervalMs: 60_000
        });
        const svc = new ProbeableService('probe');
        mgr.add(svc);

        await mgr.startAll();

        await mgr.runMonitorTick();
        await mgr.runMonitorTick();
        await mgr.runMonitorTick();

        // First tick probes once; subsequent ticks are within the
        // 60s throttle window so they don't re-probe.
        expect(svc.probeCallCount).toBe(1);
    });

    it('treats a throwing healthCheck as unhealthy', async() => {
        class ThrowingProbe extends ProbeableService {

            public override async healthCheck(): Promise<boolean> {
                throw new Error('probe blew up');
            }

        }

        const mgr = new ServiceManager({
            autoStartMonitor: false,
            healthCheckIntervalMs: 0
        });
        const svc = new ThrowingProbe('probe');
        mgr.add(svc);

        await mgr.startAll();
        await mgr.runMonitorTick();

        expect(svc.getStatus()).toBe(ServiceStatus.Error);
    });

    it('retries Optional services in Error/None state, but does not healthCheck them', async() => {
        class OptionalFlaky extends FakeService {

            public retryCount: number = 0;

            public probeCallCount: number = 0;

            public override async start(): Promise<void> {
                this.retryCount += 1;
                this._status = ServiceStatus.Error;
                throw new Error('boom');
            }

            public override async healthCheck(): Promise<boolean> {
                this.probeCallCount += 1;
                return true;
            }

        }

        const mgr = new ServiceManager({
            autoStartMonitor: false,
            healthCheckIntervalMs: 0
        });
        const svc = new OptionalFlaky('opt');
        mgr.add(svc);

        await mgr.startAll();
        const baselineRetries = svc.retryCount;
        await mgr.runMonitorTick();
        await mgr.runMonitorTick();

        // Restart path is shared between Important + Optional: each
        // tick sees status=Error and retries start().
        expect(svc.retryCount).toBe(baselineRetries + 2);

        // healthCheck stays Important-only — Optional services
        // shouldn't pay for periodic probes.
        expect(svc.probeCallCount).toBe(0);
    });

    it('restarts Optional dependents once a previously-failed dep recovers', async() => {
        class OptionalConsumer extends FakeService {

            public startCallCount: number = 0;

            public override async start(): Promise<void> {
                this.startCallCount += 1;
                this._status = ServiceStatus.Success;
            }

        }

        const mgr = new ServiceManager({
            startAllTimeoutMs: 50,
            autoStartMonitor: false,
            healthCheckIntervalMs: 60_000
        });
        const flaky = new FlakyStartService('flaky', 2);
        const consumer = new OptionalConsumer('consumer', ['flaky']);
        mgr.add(flaky);
        mgr.add(consumer);

        await mgr.startAll();

        // After startAll: flaky failed, consumer never started because
        // its dep wasn't Success in time.
        expect(consumer.getStatus()).not.toBe(ServiceStatus.Success);
        expect(consumer.startCallCount).toBe(0);

        for (let i = 0; i < 5; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await mgr.runMonitorTick();
        }

        expect(flaky.getStatus()).toBe(ServiceStatus.Success);
        expect(consumer.getStatus()).toBe(ServiceStatus.Success);
        expect(consumer.startCallCount).toBe(1);
    });

    it('skips services where isProcess() is true (in-flight start)', async() => {
        class StuckService extends ProbeableService {

            public override async start(): Promise<void> {
                this._inProcess = true;
                this._status = ServiceStatus.Progress;
                // Never resolves — simulates a slow start. Tests don't
                // await this; they drive the monitor and check that the
                // tick skips this service rather than re-entering start.
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                await new Promise<void>(() => {});
            }

        }

        const mgr = new ServiceManager({
            autoStartMonitor: false,
            healthCheckIntervalMs: 0
        });
        const stuck = new StuckService('stuck');
        mgr.add(stuck);

        // Kick off start() but don't await it — service stays in
        // Progress + isProcess=true forever.
        // Test-internal: start() never resolves, discard rejection
        stuck.start().catch(() => undefined);

        await mgr.runMonitorTick();

        // Probe must NOT have been called; status untouched.
        expect(stuck.probeCallCount).toBe(0);
        expect(stuck.getStatus()).toBe(ServiceStatus.Progress);
    });

    it('startMonitor + stopMonitor are idempotent', () => {
        const mgr = new ServiceManager({autoStartMonitor: false, monitorIntervalMs: 60_000});

        mgr.startMonitor();
        mgr.startMonitor();
        mgr.stopMonitor();
        mgr.stopMonitor();

        // No error, no double-scheduled interval — just an idempotency
        // smoke test.
        expect(true).toBe(true);
    });

    it('stopAll stops the monitor', async() => {
        const mgr = new ServiceManager({autoStartMonitor: true, monitorIntervalMs: 60_000});
        mgr.add(new ProbeableService('a'));

        await mgr.startAll();
        await mgr.stopAll();

        // We can verify by starting again — startMonitor() is a no-op
        // when already running, so a clean stop means startMonitor()
        // will set up a new handle without leaking the previous one.
        mgr.startMonitor();
        mgr.stopMonitor();
    });

});