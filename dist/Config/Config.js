import path from 'path';
import { ObjectSchema } from 'vts';
import { SchemaConfigOptions } from '../Schemas/Config/ConfigOptions.js';
import { FileHelper } from '../Utils/FileHelper.js';
export class Config {
    static DEFAULT_CONFIG_FILE = 'config.json';
    static DEFAULT_DIR = path.join('/', 'var', 'lib');
    static _instance;
    static getInstance() {
        if (!Config._instance) {
            Config._instance = new Config(SchemaConfigOptions);
        }
        return Config._instance;
    }
    _schema = null;
    _appName = null;
    _appTitle = '';
    _config = null;
    constructor(schema) {
        this._schema = schema;
    }
    setAppName(name) {
        this._appName = name;
    }
    getAppName() {
        return this._appName;
    }
    setAppTitle(title) {
        this._appTitle = title;
    }
    getAppTitle() {
        return this._appTitle;
    }
    set(aConfig) {
        this._config = aConfig;
    }
    get() {
        return this._config;
    }
    async load(configFile = null, useEnv = false) {
        let config = null;
        if (configFile) {
            try {
                const rawdata = await FileHelper.fileRead(configFile);
                console.log(`Config::load: Load json-file: ${configFile}`);
                const fileConfig = JSON.parse(rawdata);
                const errors = [];
                if (this._schema instanceof ObjectSchema) {
                    if (!this._schema.validate(fileConfig, errors)) {
                        console.log('Config::load: Config file error:');
                        console.log(JSON.stringify(errors, null, 2));
                        return null;
                    }
                }
                else {
                    console.log('Config::load: Config schema is not set!');
                }
                config = fileConfig;
            }
            catch (err) {
                console.error(err);
                return null;
            }
        }
        if (useEnv) {
            config = this._loadEnv(config);
        }
        config = this._setDefaults(config);
        if (config) {
            this.set(config);
        }
        return config;
    }
    _loadEnv(config) {
        return config;
    }
    _setDefaults(config) {
        return config;
    }
}
//# sourceMappingURL=Config.js.map