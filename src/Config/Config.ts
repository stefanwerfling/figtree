import path from 'path';
import {SchemaErrors} from 'vts';
import {ObjectSchema} from 'vts/dist/schemas/objectSchema.js';
import {ConfigOptions, SchemaConfigOptions} from '../Schemas/Config/ConfigOptions.js';
import {FileHelper} from '../Utils/FileHelper.js';

/**
 * Config
 * @template T - Config options
 */
export class Config<T extends ConfigOptions = ConfigOptions> {

    /**
     * DEFAULTS
     */
    public static readonly DEFAULT_CONFIG_FILE = 'config.json';
    public static readonly DEFAULT_DIR = path.join('/', 'var', 'lib');

    /**
     * instance
     * @protected
     */
    protected static _instance: Config<any>;

    /**
     * Return the Config instance
     * @return {Config}
     */
    public static getInstance<I extends ConfigOptions>(): Config<I> {
        if (!Config._instance) {
            Config._instance = new Config<I>(SchemaConfigOptions);
        }

        return Config._instance;
    }

    /**
     * Schema for config
     * @protected
     */
    protected _schema: ObjectSchema<any> | null = null;

    /**
     * App name
     * @private
     */
    private _appName: string | null = null;

    /**
     * global config
     * @private
     */
    protected _config: T | null = null;

    /**
     * constructor
     * @param {ObjectSchema} schema
     * @private
     */
    protected constructor(schema: ObjectSchema<any>) {
        this._schema = schema;
    }

    /**
     * Set App name
     * @param {string} name
     */
    public setAppName(name: string) {
        this._appName = name;
    }

    /**
     * Get App name
     * @return {string|null}
     */
    public getAppName(): string | null {
        return this._appName;
    }

    /**
     * Set a config
     * @param {T|null} aConfig
     */
    public set(aConfig: T | null): void {
        this._config = aConfig;
    }

    /**
     * Get a config
     * @return {T|null}
     */
    public get(): T | null {
        return this._config;
    }

    /**
     * Load a config by config file
     * @param {string} configFile
     * @param {boolean} useEnv
     */
    public async load(
        configFile: string | null = null,
        useEnv: boolean = false
    ): Promise<T | null> {
        let config: T | null = null;

        if (configFile) {
            try {
                const rawdata = await FileHelper.fileRead(configFile);

                console.log(`Config::load: Load json-file: ${configFile}`);

                const fileConfig = JSON.parse(rawdata);
                const errors: SchemaErrors = [];

                if (this._schema instanceof ObjectSchema) {
                    if (!this._schema.validate(fileConfig, errors)) {
                        console.log('Config::load: Config file error:');
                        console.log(JSON.stringify(errors, null, 2));

                        return null;
                    }
                } else {
                    console.log('Config::load: Config schema is not set!');
                }

                config = fileConfig;
            } catch (err) {
                console.error(err);
                return null;
            }
        }

        // -------------------------------------------------------------------------------------------------------------

        if (useEnv) {
            config = this._loadEnv(config);
        }

        // -------------------------------------------------------------------------------------------------------------

        config = this._setDefaults(config);

        if (config) {
            this.set(config);
        }

        return config;
    }

    /**
     * _loadEnv
     * @param config
     * @protected
     */
    protected _loadEnv(config: T | null): T | null {
        return config;
    }

    /**
     * _setDefaults
     * @param config
     * @protected
     */
    protected _setDefaults(config: T | null): T | null {
        return config;
    }

}