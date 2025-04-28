import { BackendApp } from '../../Application/BackendApp.js';
import { HttpService } from '../../Application/Services/HttpService.js';
import { MariaDBService } from '../../Application/Services/MariaDBService.js';
import { Config } from '../../Config/Config.js';
import { DBLoader } from '../../Db/MariaDb/DBLoader.js';
import { SchemaDefaultArgs } from '../../Schemas/Args/DefaultArgs.js';
import { HttpRouteLoader } from '../../Server/HttpServer/HttpRouteLoader.js';
export class ExampleBackend extends BackendApp {
    _getConfigInstance() {
        const config = Config.getInstance();
        config.setAppName('example');
        return config;
    }
    _getArgSchema() {
        return SchemaDefaultArgs;
    }
    async _initServices() {
        this._serviceList.add(new MariaDBService(DBLoader));
        this._serviceList.add(new HttpService(HttpRouteLoader));
    }
}
//# sourceMappingURL=ExampleBackend.js.map