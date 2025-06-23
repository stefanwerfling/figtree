import {ConfigBackendOptions, SchemaConfigBackendOptions} from '../Schemas/Config/ConfigBackendOptions.js';
import {ENV_DB} from '../Schemas/Config/ConfigDb.js';
import {ConfigOptions} from '../Schemas/Config/ConfigOptions.js';
import {Config} from './Config.js';

/**
 * ENV_OPTIONAL
 */
export enum ENV_OPTIONAL {
    HTTPSERVER_PORT = 'HTTPSERVER_PORT',
    HTTPSERVER_PUBLICDIR = 'HTTPSERVER_PUBLICDIR',
    LOGGING_LEVEL = 'LOGGING_LEVEL',
}

/**
 * Config for Backend
 * @template T
 */
export class ConfigBackend<T extends ConfigBackendOptions> extends Config<T> {

    /**
     * DEFAULTS
     */
    public static readonly DEFAULT_HTTPSERVER_PORT = 3000;
    public static readonly DEFAULT_HTTPSERVER_PUBLICDIR = 'frontend';
    public static readonly DEFAULT_DB_MYSQL_HOST = '127.0.0.1';
    public static readonly DEFAULT_DB_MYSQL_PORT = 3306;
    public static readonly DEFAULT_DB_REDIS_URL = 'redis://127.0.0.1:6379';
    public static readonly DEFAULT_DB_CHROMA_URL = 'http://localhost:8000/';

    /**
     * Return the Config instance
     * @return {Config}
     */
    public static getInstance<I extends ConfigOptions>(): Config<I> {
        if (!Config._instance) {
            Config._instance = new ConfigBackend(SchemaConfigBackendOptions);
        }

        return Config._instance;
    }

    /**
     * _loadEnv
     * @param {T|null} aConfig
     * @returns {T|null}
     * @protected
     */
    protected _loadEnv(aConfig: T | null): T | null {
        let config = aConfig;

        // defaults ------------------------------------------------------------------------------------------------

        if (config === null) {
            config = {
                db: {},
                httpserver: {
                    port: ConfigBackend.DEFAULT_HTTPSERVER_PORT,
                    publicdir: ConfigBackend.DEFAULT_HTTPSERVER_PUBLICDIR
                },
                logging: {
                    level: 'error'
                }
            } as T;
        }

        // optional ----------------------------------------------------------------------------------------------------

        config = this._loadEnvMariaDb(config);
        config = this._loadEnvRedisDb(config);
        config = this._loadEnvInfluxDb(config);
        config = this._loadEnvChromaDb(config);
        config = this._loadEnvHttpserver(config);
        config = this._loadEnvLogging(config);

        return config;
    }

    /**
     * Load MariaDB Env
     * @param {T} config
     * @returns {T}
     * @protected
     */
    protected _loadEnvMariaDb(config: T): T {
        const mariadbEnvList = [
            ENV_DB.DB_MYSQL_HOST,
            ENV_DB.DB_MYSQL_PORT,
            ENV_DB.DB_MYSQL_DATABASE,
            ENV_DB.DB_MYSQL_USERNAME,
            ENV_DB.DB_MYSQL_PASSWORD
        ];

        if (mariadbEnvList.some(entry => process.env[entry])) {
            config.db.mysql = {
                host: ConfigBackend.DEFAULT_DB_MYSQL_HOST,
                port: ConfigBackend.DEFAULT_DB_MYSQL_PORT,
                database: '',
                username: '',
                password: ''
            };
        }

        if (config.db.mysql) {
            if (process.env[ENV_DB.DB_MYSQL_HOST]) {
                config.db.mysql.host = process.env[ENV_DB.DB_MYSQL_HOST];
            }

            if (process.env[ENV_DB.DB_MYSQL_PORT]) {
                config.db.mysql.port = parseInt(process.env[ENV_DB.DB_MYSQL_PORT]!, 10) ||
                    ConfigBackend.DEFAULT_DB_MYSQL_PORT;
            }
        }

        return config;
    }

    /**
     * Load InfluxDB Env
     * @param {T} config
     * @returns {T}
     * @protected
     */
    protected _loadEnvInfluxDb(config: T): T {
        const influxEnvList = [
            ENV_DB.DB_INFLUX_URL,
            ENV_DB.DB_INFLUX_TOKEN,
            ENV_DB.DB_INFLUX_ORG,
            ENV_DB.DB_INFLUX_BUCKET
        ];

        if (influxEnvList.some(entry => process.env[entry])) {
            config.db.influx = {
                url: '',
                password: '',
                username: '',
                org: '',
                bucket: '',
                token: ''
            };
        }

        if (config.db.influx) {
            if (process.env[ENV_DB.DB_INFLUX_URL]) {
                config.db.influx.url = process.env[ENV_DB.DB_INFLUX_URL];
            }

            if (process.env[ENV_DB.DB_INFLUX_TOKEN]) {
                config.db.influx.token = process.env[ENV_DB.DB_INFLUX_TOKEN];
            }

            if (process.env[ENV_DB.DB_INFLUX_ORG]) {
                config.db.influx.org = process.env[ENV_DB.DB_INFLUX_ORG];
            }

            if (process.env[ENV_DB.DB_INFLUX_BUCKET]) {
                config.db.influx.bucket = process.env[ENV_DB.DB_INFLUX_BUCKET];
            }
        }

        return config;
    }

    /**
     * Load Redis Env
     * @param {T} config
     * @returns {T}
     * @protected
     */
    protected _loadEnvRedisDb(config: T): T {
        const redisEnvList = [
            ENV_DB.DB_REDIS_URL,
            ENV_DB.DB_REDIS_PASSWORD
        ];

        if (redisEnvList.some(entry => process.env[entry])) {
            config.db.redis = {
                url: ConfigBackend.DEFAULT_DB_REDIS_URL,
                password: ''
            };
        }

        if (config.db.redis) {
            if (process.env[ENV_DB.DB_REDIS_URL]) {
                config.db.redis.url = process.env[ENV_DB.DB_REDIS_URL];
            }

            if (process.env[ENV_DB.DB_REDIS_PASSWORD]) {
                config.db.redis.password = process.env[ENV_DB.DB_REDIS_PASSWORD];
            }
        }

        return config;
    }

    /**
     * Load env for chroma db
     * @param {T} config
     * @return {T}
     * @protected
     */
    protected _loadEnvChromaDb(config: T): T {
        if (process.env[ENV_DB.DB_CHROMA_URL]) {
            config.db.chroma = {
                url: ConfigBackend.DEFAULT_DB_CHROMA_URL
            };
        }

        if (config.db.chroma) {
            if (process.env[ENV_DB.DB_CHROMA_URL]) {
                config.db.chroma.url = process.env[ENV_DB.DB_CHROMA_URL];
            }
        }

        return config;
    }

    /**
     * Load HttpServer Env
     * @param {T} config
     * @returns {T}
     * @protected
     */
    protected _loadEnvHttpserver(config: T): T {
        if (process.env[ENV_OPTIONAL.HTTPSERVER_PORT]) {
            config.httpserver.port = parseInt(process.env[ENV_OPTIONAL.HTTPSERVER_PORT]!, 10) ||
                ConfigBackend.DEFAULT_HTTPSERVER_PORT;
        }

        if (process.env[ENV_OPTIONAL.HTTPSERVER_PUBLICDIR]) {
            config.httpserver.publicdir = process.env[ENV_OPTIONAL.HTTPSERVER_PUBLICDIR];
        }

        return config;
    }

    /**
     * Load Logging Env
     * @param {T} config
     * @returns {T}
     * @protected
     */
    protected _loadEnvLogging(config: T): T {
        if (process.env[ENV_OPTIONAL.LOGGING_LEVEL]) {
            config.logging = {
                level: process.env[ENV_OPTIONAL.LOGGING_LEVEL]
            };
        }

        return config;
    }
}