/* eslint-disable max-classes-per-file */
import {ConfigOptions, DefaultArgs, ProviderEntry} from 'figtree-schemas';
import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {BackendApp} from '../../../src/Application/BackendApp.js';
import {APluginEvent} from '../../../src/Plugins/APluginEvent.js';
import {PluginManager} from '../../../src/Plugins/PluginManager.js';
import {AProviderOnLoadEvent} from '../../../src/Provider/AProviderOnLoadEvent.js';
import {IServiceProvider, ServiceProviderService} from '../../../src/Service/IServiceProvider.js';
import {ServiceAbstract} from '../../../src/Service/ServiceAbstract.js';
import {ServiceProviders} from '../../../src/Service/ServiceProviders.js';
import {ServiceProviderType} from '../../../src/Service/ServiceProviderType.js';

/**
 * Minimal service used as a plugin contribution.
 */
class FakeService extends ServiceAbstract {

    public constructor(name: string, dependencies?: string[]) {
        super(name, dependencies);
    }

}

/**
 * Service provider returning a fixed set of services. The reported type is
 * configurable so tests can assert that `BaseProviders` filters by type.
 */
class FakeServiceProvider implements IServiceProvider {

    private readonly _name: string;
    private readonly _services: ServiceProviderService[];
    private readonly _type: string;

    public constructor(name: string, services: ServiceProviderService[], type: string = ServiceProviderType) {
        this._name = name;
        this._services = services;
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

    public getServices(): ServiceProviderService[] {
        return this._services;
    }

}

/**
 * On-load event exposing a fixed provider list.
 */
class FakeServiceOnLoadEvent extends AProviderOnLoadEvent<ProviderEntry, IServiceProvider> {

    private readonly _providers: IServiceProvider[];

    public constructor(providers: IServiceProvider[]) {
        super();
        this._providers = providers;
    }

    public getName(): string {
        return 'FakeServiceOnLoadEvent';
    }

    public async getProviders(): Promise<IServiceProvider[]> {
        return this._providers;
    }

}

/**
 * PluginManager subclass that lets a test inject events without a real plugin
 * scan, and reset the process-wide singleton between tests.
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
        super('service-providers-test');
    }

    public async runInitServicesFromPlugins(): Promise<void> {
        await this._initServicesFromPlugins();
    }

}

describe('ServiceProviders', () => {
    beforeEach(() => {
        TestPluginManager.reset();
    });

    afterEach(() => {
        TestPluginManager.reset();
    });

    it('collects and flattens services from every registered provider', async() => {
        const pm = new TestPluginManager('test');
        const svcA = new FakeService('svc-a');
        const svcB = new FakeService('svc-b');
        pm.injectEvent(new FakeServiceOnLoadEvent([
            new FakeServiceProvider('p1', [{service: svcA}, {service: svcB, roles: ['cron']}])
        ]));

        const collected = await new ServiceProviders().getProvidersServices();

        expect(collected).toHaveLength(2);
        expect(collected.map((s) => s.service.getServiceName())).toEqual(['svc-a', 'svc-b']);
        expect(collected[1].roles).toEqual(['cron']);
    });

    it('ignores providers of a different type', async() => {
        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeServiceOnLoadEvent([
            new FakeServiceProvider('wrong', [{service: new FakeService('nope')}], 'not-a-service')
        ]));

        const collected = await new ServiceProviders().getProvidersServices();

        expect(collected).toHaveLength(0);
    });
});

describe('BackendApp::_initServicesFromPlugins', () => {
    beforeEach(() => {
        TestPluginManager.reset();
    });

    afterEach(() => {
        TestPluginManager.reset();
    });

    it('is a no-op when no plugin manager is initialized', async() => {
        const app = new TestBackendApp();

        await app.runInitServicesFromPlugins();

        expect(app.getServiceManager().getInfoList()).toHaveLength(0);
    });

    it('registers plugin-provided services with the service manager', async() => {
        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeServiceOnLoadEvent([
            new FakeServiceProvider('p1', [{service: new FakeService('plugin-svc')}])
        ]));

        const app = new TestBackendApp();
        await app.runInitServicesFromPlugins();

        expect(app.getServiceManager().getByName('plugin-svc')).not.toBeNull();
    });

    it('skips a plugin service whose name collides with an already registered service', async() => {
        const app = new TestBackendApp();
        const hostService = new FakeService('shared-name');
        app.getServiceManager().add(hostService);

        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeServiceOnLoadEvent([
            new FakeServiceProvider('p1', [{service: new FakeService('shared-name')}])
        ]));

        await app.runInitServicesFromPlugins();

        // The host service must still be the only registration under that name.
        expect(app.getServiceManager().getInfoList().filter((i) => i.name === 'shared-name')).toHaveLength(1);
        expect(app.getServiceManager().getByName('shared-name')).toBe(hostService);
    });
});