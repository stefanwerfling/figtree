import {ConfigOptions, DefaultArgs, SchemaDefaultArgs} from 'figtree-schemas';
import {Schema} from 'vts';
import {ACL, BackendApp, HttpService, PluginService} from 'figtree';
import {MyACLRbac} from '../ACL/MyACLRbac.js';
import {ExampleConfig} from '../Config/ExampleConfig.js';
import {ExampleRouteLoader} from '../Routes/ExampleRouteLoader.js';

export class ExampleBackend extends BackendApp<DefaultArgs, ConfigOptions> {

    public static NAME = 'example_backend';

    public constructor() {
        super(ExampleBackend.NAME);
    }

    protected override _getConfigInstance(): ExampleConfig {
        const config = ExampleConfig.getInstance();
        config.setAppName('example');

        return config;
    }

    protected override _getArgSchema(): Schema<DefaultArgs> | null {
        return SchemaDefaultArgs;
    }

    protected override async _initServices(): Promise<void> {
        ACL.getInstance().addController(new MyACLRbac());

        this._serviceManager.add(new PluginService(ExampleBackend.NAME));
        this._serviceManager.add(new HttpService(ExampleRouteLoader));
    }

}