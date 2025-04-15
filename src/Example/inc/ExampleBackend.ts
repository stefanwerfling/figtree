import {Schema} from 'vts';
import {BackendApp} from '../../Application/BackendApp.js';
import {Config} from '../../Config/Config.js';
import {DBEntitiesLoader} from '../../Db/DBEntitiesLoader.js';
import {DefaultArgs, SchemaDefaultArgs} from '../../Schemas/Args/DefaultArgs.js';
import {ConfigOptions} from '../../Schemas/Config/ConfigOptions.js';

export class ExampleBackend extends BackendApp<DefaultArgs, ConfigOptions> {

    protected _getConfigInstance(): Config<ConfigOptions> {
        const config = Config.getInstance<ConfigOptions>();
        config.setAppName('example');

        return config;
    }

    protected _getArgSchema(): Schema<DefaultArgs>|null {
        return SchemaDefaultArgs;
    }

    protected async _startServices(): Promise<void> {
        await super._startServices();
        await this._startMariaDBService(DBEntitiesLoader);
    }
}