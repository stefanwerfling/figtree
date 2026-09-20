/* eslint-disable max-classes-per-file */
import {ConfigOptions, DefaultArgs, ProviderEntry} from 'figtree-schemas';
import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {BackendApp} from '../../../src/Application/BackendApp.js';
import {APluginEvent} from '../../../src/Plugins/APluginEvent.js';
import {PluginManager} from '../../../src/Plugins/PluginManager.js';
import {AProviderOnLoadEvent} from '../../../src/Provider/AProviderOnLoadEvent.js';
import {CronJobProviders, DEFAULT_CRON_ROLES} from '../../../src/Service/CronJobProviders.js';
import {CronJobProviderType} from '../../../src/Service/CronJobProviderType.js';
import {CronJobProviderJob, ICronJobProvider} from '../../../src/Service/ICronJobProvider.js';
import {ServiceJobAbstract} from '../../../src/Service/ServiceJobAbstract.js';

/**
 * Minimal cron job used as a plugin contribution. `_execute` never runs in
 * these tests — the jobs are only registered, never started.
 */
class FakeJob extends ServiceJobAbstract {

    public constructor(name: string) {
        super(name);
    }

    protected async _execute(): Promise<void> {
        // no-op
    }

}

/**
 * Cron job provider returning a fixed set of jobs.
 */
class FakeCronJobProvider implements ICronJobProvider {

    private readonly _name: string;
    private readonly _jobs: CronJobProviderJob[];
    private readonly _type: string;

    public constructor(name: string, jobs: CronJobProviderJob[], type: string = CronJobProviderType) {
        this._name = name;
        this._jobs = jobs;
        this._type = type;
    }

    public getName(): string {
        return this._name;
    }

    public getTitle(): string {
        return this._name;
    }

    public getType(): string {
        return this._type;
    }

    public getProviderEntry(): ProviderEntry {
        return {name: this._name, title: this._name};
    }

    public getCronJobs(): CronJobProviderJob[] {
        return this._jobs;
    }

}

/**
 * On-load event exposing a fixed provider list.
 */
class FakeCronJobOnLoadEvent extends AProviderOnLoadEvent<ProviderEntry, ICronJobProvider> {

    private readonly _providers: ICronJobProvider[];

    public constructor(providers: ICronJobProvider[]) {
        super();
        this._providers = providers;
    }

    public getName(): string {
        return 'FakeCronJobOnLoadEvent';
    }

    public async getProviders(): Promise<ICronJobProvider[]> {
        return this._providers;
    }

}

/**
 * PluginManager subclass that lets a test inject events and reset the
 * process-wide singleton between tests.
 */
class TestPluginManager extends PluginManager {

    public injectEvent(event: APluginEvent): void {
        const list = this._events.get('test-plugin') ?? [];
        list.push(event);
        this._events.set('test-plugin', list);
    }

    public static reset(): void {
        PluginManager._instance = null;
    }

}

/**
 * BackendApp subclass exposing the protected plugin-service wiring.
 */
class TestBackendApp extends BackendApp<DefaultArgs, ConfigOptions> {

    public constructor() {
        super('cronjob-providers-test');
    }

    public async runInitServicesFromPlugins(): Promise<void> {
        await this._initServicesFromPlugins();
    }

}

describe('CronJobProviders', () => {
    beforeEach(() => {
        TestPluginManager.reset();
    });

    afterEach(() => {
        TestPluginManager.reset();
    });

    it('defaults a job\'s roles to ["cron"] when the provider omits them', async() => {
        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeCronJobOnLoadEvent([
            new FakeCronJobProvider('p1', [{job: new FakeJob('nightly')}])
        ]));

        const collected = await new CronJobProviders().getProvidersJobs();

        expect(collected).toHaveLength(1);
        expect(collected[0].service.getServiceName()).toBe('nightly');
        expect(collected[0].roles).toEqual(DEFAULT_CRON_ROLES);
    });

    it('preserves explicit roles, including an empty array (run everywhere)', async() => {
        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeCronJobOnLoadEvent([
            new FakeCronJobProvider('p1', [
                {job: new FakeJob('targeted'), roles: ['worker-a']},
                {job: new FakeJob('everywhere'), roles: []}
            ])
        ]));

        const collected = await new CronJobProviders().getProvidersJobs();

        expect(collected.map((s) => s.roles)).toEqual([['worker-a'], []]);
    });

    it('ignores providers of a different type', async() => {
        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeCronJobOnLoadEvent([
            new FakeCronJobProvider('wrong', [{job: new FakeJob('nope')}], 'service')
        ]));

        const collected = await new CronJobProviders().getProvidersJobs();

        expect(collected).toHaveLength(0);
    });

    it('is wired into BackendApp — cron jobs get registered with the service manager', async() => {
        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeCronJobOnLoadEvent([
            new FakeCronJobProvider('p1', [{job: new FakeJob('plugin-cron')}])
        ]));

        const app = new TestBackendApp();
        await app.runInitServicesFromPlugins();

        expect(app.getServiceManager().getByName('plugin-cron')).not.toBeNull();
    });
});