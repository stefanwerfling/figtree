import { SchemaDefaultArgs } from 'figtree-schemas';
import { ACL } from '../../ACL/ACL.js';
import { BackendApp } from '../../Application/BackendApp.js';
import { HttpService } from '../../Application/Services/HttpService.js';
import { PluginService } from '../../Application/Services/PluginService.js';
import { MyACLRbac } from '../ACL/MyACLRbac.js';
import { ExampleConfig } from '../Config/ExampleConfig.js';
import { ExampleRouteLoader } from '../Routes/ExampleRouteLoader.js';
export class ExampleBackend extends BackendApp {
    static NAME = 'example_backend';
    constructor() {
        super(ExampleBackend.NAME);
    }
    _getConfigInstance() {
        const config = ExampleConfig.getInstance();
        config.setAppName('example');
        return config;
    }
    _getArgSchema() {
        return SchemaDefaultArgs;
    }
    async _initServices() {
        ACL.getInstance().addController(new MyACLRbac());
        this._serviceManager.add(new PluginService(ExampleBackend.NAME));
        this._serviceManager.add(new HttpService(ExampleRouteLoader));
    }
}
//# sourceMappingURL=ExampleBackend.js.map