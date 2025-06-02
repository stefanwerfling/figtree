import { BackendApp } from '../../Application/BackendApp.js';
import { HttpService } from '../../Application/Services/HttpService.js';
import { SchemaDefaultArgs } from '../../Schemas/Args/DefaultArgs.js';
import { ExampleConfig } from '../Config/ExampleConfig.js';
import { ExampleRouteLoader } from '../Routes/ExampleRouteLoader.js';
export class ExampleBackend extends BackendApp {
    _getConfigInstance() {
        const config = ExampleConfig.getInstance();
        config.setAppName('example');
        return config;
    }
    _getArgSchema() {
        return SchemaDefaultArgs;
    }
    async _initServices() {
        this._serviceManager.add(new HttpService(ExampleRouteLoader));
    }
}
//# sourceMappingURL=ExampleBackend.js.map