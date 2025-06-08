import {Schema} from 'vts';
import {BackendApp} from '../../Application/BackendApp.js';
import {HttpService} from '../../Application/Services/HttpService.js';
import {MariaDBService} from '../../Application/Services/MariaDBService.js';
import {PluginService} from '../../Application/Services/PluginService.js';
import {Config} from '../../Config/Config.js';
import {DBLoader} from '../../Db/MariaDb/DBLoader.js';
import {DefaultArgs, SchemaDefaultArgs} from '../../Schemas/Args/DefaultArgs.js';
import {ConfigOptions} from '../../Schemas/Config/ConfigOptions.js';
import {ExampleConfig} from '../Config/ExampleConfig.js';
import {ExampleRouteLoader} from '../Routes/ExampleRouteLoader.js';

export class ExampleBackend extends BackendApp<DefaultArgs, ConfigOptions> {

    public static NAME = 'example_backend';

    /**
     * Constructor
     */
    public constructor() {
        super(ExampleBackend.NAME);
    }

    protected _getConfigInstance(): Config<ConfigOptions> {
        const config = ExampleConfig.getInstance();
        config.setAppName('example');

        return config;
    }

    protected _getArgSchema(): Schema<DefaultArgs>|null {
        return SchemaDefaultArgs;
    }

    protected async _initServices(): Promise<void> {
        this._serviceManager.add(new PluginService(ExampleBackend.NAME));
        //this._serviceList.add(new MariaDBService(DBLoader));
        this._serviceManager.add(new HttpService(ExampleRouteLoader));
    }

}