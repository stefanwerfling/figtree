import {Config} from '../../Config/Config.js';
import {ConfigBackend} from '../../Config/ConfigBackend.js';
import {ConfigBackendOptions, SchemaConfigBackendOptions} from '../../Schemas/Config/ConfigBackendOptions.js';

/**
 * Example Config
 */
export class ExampleConfig extends ConfigBackend {

    /**
     * Return the Config instance
     * @return {Config}
     */
    public static getInstance(): ExampleConfig {
        if (!Config._instance) {
            Config._instance = new ExampleConfig(SchemaConfigBackendOptions);
        }

        return Config._instance as ExampleConfig;
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