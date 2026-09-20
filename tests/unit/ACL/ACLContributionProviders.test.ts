/* eslint-disable max-classes-per-file */
import {ConfigOptions, DefaultArgs, ProviderEntry} from 'figtree-schemas';
import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {ACL} from '../../../src/ACL/ACL.js';
import {ACLContributionProviders} from '../../../src/ACL/ACLContributionProviders.js';
import {ACLContributionProviderType} from '../../../src/ACL/ACLContributionProviderType.js';
import {ACLRight} from '../../../src/ACL/ACLRight.js';
import {ACLRole} from '../../../src/ACL/ACLRole.js';
import {IACLContributionProvider} from '../../../src/ACL/IACLContributionProvider.js';
import {IACLController} from '../../../src/ACL/IACLController.js';
import {BackendApp} from '../../../src/Application/BackendApp.js';
import {APluginEvent} from '../../../src/Plugins/APluginEvent.js';
import {PluginManager} from '../../../src/Plugins/PluginManager.js';
import {AProviderOnLoadEvent} from '../../../src/Provider/AProviderOnLoadEvent.js';

/**
 * Controller that grants access only for a single configured right.
 */
class FakeController implements IACLController {

    private readonly _grantedRight: ACLRight;

    public constructor(grantedRight: ACLRight) {
        this._grantedRight = grantedRight;
    }

    public async checkAccess(_role: ACLRole, right: ACLRight, _userRightList?: ACLRight[]): Promise<boolean> {
        return right === this._grantedRight;
    }

}

/**
 * ACL contribution provider returning a fixed set of controllers.
 */
class FakeACLContributionProvider implements IACLContributionProvider {

    private readonly _name: string;
    private readonly _controllers: IACLController[];
    private readonly _type: string;

    public constructor(name: string, controllers: IACLController[], type: string = ACLContributionProviderType) {
        this._name = name;
        this._controllers = controllers;
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

    public getControllers(): IACLController[] {
        return this._controllers;
    }

}

/**
 * On-load event exposing a fixed provider list.
 */
class FakeACLOnLoadEvent extends AProviderOnLoadEvent<ProviderEntry, IACLContributionProvider> {

    private readonly _providers: IACLContributionProvider[];

    public constructor(providers: IACLContributionProvider[]) {
        super();
        this._providers = providers;
    }

    public getName(): string {
        return 'FakeACLOnLoadEvent';
    }

    public async getProviders(): Promise<IACLContributionProvider[]> {
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
 * ACL subclass exposing a reset of the process-wide singleton.
 */
class TestACL extends ACL {

    public static reset(): void {
        ACL._instance = null;
    }

}

/**
 * BackendApp subclass exposing the protected ACL wiring.
 */
class TestBackendApp extends BackendApp<DefaultArgs, ConfigOptions> {

    public constructor() {
        super('acl-providers-test');
    }

    public async runInitACLFromPlugins(): Promise<void> {
        await this._initACLFromPlugins();
    }

}

describe('ACLContributionProviders', () => {
    beforeEach(() => {
        TestPluginManager.reset();
        TestACL.reset();
    });

    afterEach(() => {
        TestPluginManager.reset();
        TestACL.reset();
    });

    it('collects and flattens controllers from every registered provider', async() => {
        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeACLOnLoadEvent([
            new FakeACLContributionProvider('p1', [new FakeController('a'), new FakeController('b')])
        ]));

        const collected = await new ACLContributionProviders().getProvidersControllers();

        expect(collected).toHaveLength(2);
    });

    it('ignores providers of a different type', async() => {
        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeACLOnLoadEvent([
            new FakeACLContributionProvider('wrong', [new FakeController('a')], 'service')
        ]));

        const collected = await new ACLContributionProviders().getProvidersControllers();

        expect(collected).toHaveLength(0);
    });
});

describe('BackendApp::_initACLFromPlugins', () => {
    beforeEach(() => {
        TestPluginManager.reset();
        TestACL.reset();
    });

    afterEach(() => {
        TestPluginManager.reset();
        TestACL.reset();
    });

    it('is a no-op when no plugin manager is initialized', async() => {
        const app = new TestBackendApp();

        await app.runInitACLFromPlugins();

        // No controllers registered → default deny.
        expect(await ACL.getInstance().checkAccess('user', 'granted-right')).toBe(false);
    });

    it('registers plugin-provided controllers with the ACL singleton', async() => {
        const pm = new TestPluginManager('test');
        pm.injectEvent(new FakeACLOnLoadEvent([
            new FakeACLContributionProvider('p1', [new FakeController('granted-right')])
        ]));

        const app = new TestBackendApp();
        await app.runInitACLFromPlugins();

        expect(await ACL.getInstance().checkAccess('user', 'granted-right')).toBe(true);
        expect(await ACL.getInstance().checkAccess('user', 'other-right')).toBe(false);
    });
});