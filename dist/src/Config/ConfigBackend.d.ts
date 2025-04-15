import { ConfigBackendOptions } from '../Schemas/Config/ConfigBackendOptions.js';
import { ConfigOptions } from '../Schemas/Config/ConfigOptions.js';
import { Config } from './Config.js';
export declare enum ENV_OPTIONAL {
    HTTPSERVER_PORT = "HTTPSERVER_PORT",
    HTTPSERVER_PUBLICDIR = "HTTPSERVER_PUBLICDIR",
    LOGGING_LEVEL = "LOGGING_LEVEL"
}
export declare class ConfigBackend extends Config<ConfigBackendOptions> {
    static readonly DEFAULT_HTTPSERVER_PORT = 3000;
    static readonly DEFAULT_HTTPSERVER_PUBLICDIR = "frontend";
    static readonly DEFAULT_DB_MYSQL_HOST = "127.0.0.1";
    static readonly DEFAULT_DB_MYSQL_PORT = 3306;
    static readonly DEFAULT_REDIS_URL = "redis://127.0.0.1:6379";
    static getInstance<I extends ConfigOptions>(): Config<I>;
    protected _loadEnv(aConfig: ConfigBackendOptions | null): ConfigBackendOptions | null;
    protected _loadEnvMariaDb(config: ConfigBackendOptions): ConfigBackendOptions;
    protected _loadEnvInfluxDb(config: ConfigBackendOptions): ConfigBackendOptions;
    protected _loadEnvRedisDb(config: ConfigBackendOptions): ConfigBackendOptions;
    protected _loadEnvHttpserver(config: ConfigBackendOptions): ConfigBackendOptions;
    protected _loadEnvLogging(config: ConfigBackendOptions): ConfigBackendOptions;
}
