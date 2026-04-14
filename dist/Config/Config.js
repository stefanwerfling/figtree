import { SchemaConfigOptions } from 'figtree-schemas';
import path from 'path';
import dotenv from 'dotenv';
import { ObjectSchema } from 'vts';
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
    async _loadEnvFile(envfile = '.env') {
        try {
            if (await FileHelper.fileExist(envfile)) {
                dotenv.config({ path: envfile });
                console.log('Config::_loadEnv: .env loaded into process.env');
            }
            else {
                console.log('Config::_loadEnv: .env file not found, skipping');
            }
        }
        catch (err) {
            console.log('Config::_loadEnv: dotenv not installed, skipping .env');
        }
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
                        console.error('Config::load: Config file error:');
                        console.error(JSON.stringify(errors, null, 2));
                        return null;
                    }
                }
                else {
                    console.error('Config::load: Config schema is not set!');
                    return null;
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