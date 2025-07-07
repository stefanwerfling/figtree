import { SchemaConfigBackendOptions } from '../Schemas/Config/ConfigBackendOptions.js';
import { ENV_DB } from '../Schemas/Config/ConfigDb.js';
import { Config } from './Config.js';
export var ENV_OPTIONAL;
(function (ENV_OPTIONAL) {
    ENV_OPTIONAL["HTTPSERVER_PORT"] = "HTTPSERVER_PORT";
    ENV_OPTIONAL["HTTPSERVER_PUBLICDIR"] = "HTTPSERVER_PUBLICDIR";
    ENV_OPTIONAL["LOGGING_LEVEL"] = "LOGGING_LEVEL";
})(ENV_OPTIONAL || (ENV_OPTIONAL = {}));
export class ConfigBackend extends Config {
    static DEFAULT_HTTPSERVER_PORT = 3000;
    static DEFAULT_HTTPSERVER_PUBLICDIR = 'frontend';
    static DEFAULT_DB_MYSQL_HOST = '127.0.0.1';
    static DEFAULT_DB_MYSQL_PORT = 3306;
    static DEFAULT_DB_REDIS_URL = 'redis://127.0.0.1:6379';
    static DEFAULT_DB_CHROMA_URL = 'http://localhost:8000/';
    static getInstance() {
        if (!Config._instance) {
            Config._instance = new ConfigBackend(SchemaConfigBackendOptions);
        }
        return Config._instance;
    }
    _loadEnv(aConfig) {
        let config = aConfig;
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
            };
        }
        config = this._loadEnvMariaDb(config);
        config = this._loadEnvRedisDb(config);
        config = this._loadEnvInfluxDb(config);
        config = this._loadEnvChromaDb(config);
        config = this._loadEnvHttpserver(config);
        config = this._loadEnvLogging(config);
        return config;
    }
    _loadEnvMariaDb(config) {
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
                config.db.mysql.port = parseInt(process.env[ENV_DB.DB_MYSQL_PORT], 10) ||
                    ConfigBackend.DEFAULT_DB_MYSQL_PORT;
            }
        }
        return config;
    }
    _loadEnvInfluxDb(config) {
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
    _loadEnvRedisDb(config) {
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
    _loadEnvChromaDb(config) {
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
    _loadEnvHttpserver(config) {
        if (process.env[ENV_OPTIONAL.HTTPSERVER_PORT]) {
            config.httpserver.port = parseInt(process.env[ENV_OPTIONAL.HTTPSERVER_PORT], 10) ||
                ConfigBackend.DEFAULT_HTTPSERVER_PORT;
        }
        if (process.env[ENV_OPTIONAL.HTTPSERVER_PUBLICDIR]) {
            config.httpserver.publicdir = process.env[ENV_OPTIONAL.HTTPSERVER_PUBLICDIR];
        }
        return config;
    }
    _loadEnvLogging(config) {
        if (process.env[ENV_OPTIONAL.LOGGING_LEVEL]) {
            config.logging = {
                level: process.env[ENV_OPTIONAL.LOGGING_LEVEL]
            };
        }
        return config;
    }
}
//# sourceMappingURL=ConfigBackend.js.map