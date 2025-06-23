import { ConfigBackendOptions } from '../Schemas/Config/ConfigBackendOptions.js';
import { ConfigOptions } from '../Schemas/Config/ConfigOptions.js';
import { Config } from './Config.js';
export declare enum ENV_OPTIONAL {
    HTTPSERVER_PORT = "HTTPSERVER_PORT",
    HTTPSERVER_PUBLICDIR = "HTTPSERVER_PUBLICDIR",
    LOGGING_LEVEL = "LOGGING_LEVEL"
}
export declare class ConfigBackend<T extends ConfigBackendOptions> extends Config<T> {
    static readonly DEFAULT_HTTPSERVER_PORT = 3000;
    static readonly DEFAULT_HTTPSERVER_PUBLICDIR = "frontend";
    static readonly DEFAULT_DB_MYSQL_HOST = "127.0.0.1";
    static readonly DEFAULT_DB_MYSQL_PORT = 3306;
    static readonly DEFAULT_DB_REDIS_URL = "redis://127.0.0.1:6379";
    static readonly DEFAULT_DB_CHROMA_URL = "http://localhost:8000/";
    static getInstance<I extends ConfigOptions>(): Config<I>;
    protected _loadEnv(aConfig: T | null): T | null;
    protected _loadEnvMariaDb(config: T): T;
    protected _loadEnvInfluxDb(config: T): T;
    protected _loadEnvRedisDb(config: T): T;
    protected _loadEnvChromaDb(config: T): T;
    protected _loadEnvHttpserver(config: T): T;
    protected _loadEnvLogging(config: T): T;
}
