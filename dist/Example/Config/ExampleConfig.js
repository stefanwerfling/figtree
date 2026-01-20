import { SchemaConfigBackendOptions } from 'figtree_schemas';
import { Config } from '../../Config/Config.js';
import { ConfigBackend } from '../../Config/ConfigBackend.js';
export class ExampleConfig extends ConfigBackend {
    static getInstance() {
        if (!Config._instance) {
            Config._instance = new ExampleConfig(SchemaConfigBackendOptions);
        }
        return Config._instance;
    }
    _loadEnv(aConfig) {
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
//# sourceMappingURL=ExampleConfig.js.map