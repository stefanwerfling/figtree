import { BackendApp } from '../../Application/BackendApp.js';
import { Config } from '../../Config/Config.js';
import { DBLoader } from '../../Db/MariaDb/DBLoader.js';
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
        await this._startMariaDBService(DBLoader);
        await this._startInfluxDBService();
        await this._startRedisDBService([]);
    }
}
//# sourceMappingURL=ExampleBackend.js.map