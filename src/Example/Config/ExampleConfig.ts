import {Config} from '../../Config/Config.js';
import {ConfigBackend} from '../../Config/ConfigBackend.js';
import {ConfigBackendOptions, SchemaConfigBackendOptions} from '../../Schemas/Config/ConfigBackendOptions.js';
import {ConfigOptions} from '../../Schemas/Config/ConfigOptions.js';

/**
 * Example Config
 */
export class ExampleConfig extends ConfigBackend<ConfigBackendOptions> {

    /**
     * Return the Config instance
     * @return {Config}
     */
    public static getInstance<I extends ConfigOptions>(): Config<I> {
        if (!Config._instance) {
            Config._instance = new ExampleConfig(SchemaConfigBackendOptions);
        }

        return Config._instance;
    }

    /**
     * _loadEnv
     * @param {ConfigBackendOptions|null} aConfig
     * @returns {ConfigBackendOptions|null}
     * @protected
     */
    protected _loadEnv(aConfig: ConfigBackendOptions | null): ConfigBackendOptions | null {
        let config = aConfig;

        if (config === null) {
            config = {
                db: {
                    mysql: {
                        database: '',
                        host: '',
                        password: '',
                        port: 3362,
                        username: 'root'
                    }
                },
                logging: {
                    level: 'error'
                },
                httpserver: {
                    port: 3000,
                    publicdir: './public',
                    csrf: {
                        cookie: true
                    }
                }
            };
        }

        return config;
    }

}