import { BackendApp } from '../../Application/BackendApp.js';
import { Config } from '../../Config/Config.js';
import { DBEntitiesLoader } from '../../Db/DBEntitiesLoader.js';
import { SchemaDefaultArgs } from '../../Schemas/Args/DefaultArgs.js';
export class ExampleBackend extends BackendApp {
    _getConfigInstance() {
        const config = Config.getInstance();
        config.setAppName('example');
        return config;
    }
    _getArgSchema() {
        return SchemaDefaultArgs;
    }
    async _startServices() {
        await super._startServices();
        await this._startMariaDBService(DBEntitiesLoader);
    }
}
//# sourceMappingURL=ExampleBackend.js.map