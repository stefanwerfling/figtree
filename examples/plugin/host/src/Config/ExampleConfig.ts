import {ConfigBackendOptions, SchemaConfigBackendOptions} from 'figtree-schemas';
import {Config, ConfigBackend} from 'figtree';

/**
 * Example Config — extends ConfigBackend with custom env defaults.
 */
export class ExampleConfig extends ConfigBackend {

    public static override getInstance(): ExampleConfig {
        if (!Config._instance) {
            Config._instance = new ExampleConfig(SchemaConfigBackendOptions);
        }

        return Config._instance as ExampleConfig;
    }

    protected override _loadEnv(aConfig: ConfigBackendOptions | null): ConfigBackendOptions | null {
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
                    csrf: undefined
                }
            };
        }

        return config;
    }

}