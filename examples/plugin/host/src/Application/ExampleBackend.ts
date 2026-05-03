import {ConfigOptions, DefaultArgs, SchemaDefaultArgs} from 'figtree-schemas';
import {Schema} from 'vts';
import {ACL, BackendApp, HttpService, PluginService} from 'figtree';
import {MyACLRbac} from '../ACL/MyACLRbac.js';
import {ExampleConfig} from '../Config/ExampleConfig.js';
import {ExampleRouteLoader} from '../Routes/ExampleRouteLoader.js';

export class ExampleBackend extends BackendApp<DefaultArgs, ConfigOptions> {

    /**
     * Service name — also used by `PluginManager` to resolve the plugin
     * directory at `node_modules/<NAME>/...`.
     */
    public static NAME = 'example_plugin_host';

    public constructor() {
        super(ExampleBackend.NAME);
    }

    protected override _getConfigInstance(): ExampleConfig {
        const config = ExampleConfig.getInstance();
        config.setAppName('example-plugin-host');

        return config;
    }

    protected override _getArgSchema(): Schema<DefaultArgs> | null {
        return SchemaDefaultArgs;
    }

    protected override async _initServices(): Promise<void> {
        ACL.getInstance().addController(new MyACLRbac());

        // PluginService scans node_modules for `package.json[figtree]` entries.
        // The example plugin (../my-plugin) is installed via `file:` so it shows
        // up under `host/node_modules/my-plugin` after `npm install`.
        this._serviceManager.add(new PluginService(ExampleBackend.NAME));

        // HttpService starts AFTER PluginService — by then the plugin's
        // HttpRouteProviders / HttpMiddlewareProviders have been registered.
        this._serviceManager.add(new HttpService(ExampleRouteLoader));
    }

}