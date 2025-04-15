import { SchemaConfigBackendOptions } from '../Schemas/Config/ConfigBackendOptions.js';
import { ENV_DUTY_DB, ENV_OPTIONAL_DB } from '../Schemas/Config/ConfigDb.js';
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
    static DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';
    static getInstance() {
        if (!Config._instance) {
            Config._instance = new ConfigBackend(SchemaConfigBackendOptions);
        }
        return Config._instance;
    }
    _loadEnv(aConfig) {
        let config = aConfig;
        if (config) {
            if (process.env[ENV_DUTY_DB.DB_MYSQL_USERNAME]) {
                config.db.mysql.username = process.env[ENV_DUTY_DB.DB_MYSQL_USERNAME];
            }
            if (process.env[ENV_DUTY_DB.DB_MYSQL_PASSWORD]) {
                config.db.mysql.password = process.env[ENV_DUTY_DB.DB_MYSQL_PASSWORD];
            }
            if (process.env[ENV_DUTY_DB.DB_MYSQL_DATABASE]) {
                config.db.mysql.database = process.env[ENV_DUTY_DB.DB_MYSQL_DATABASE];
            }
        }
        else {
            for (const env of Object.values(ENV_DUTY_DB)) {
                if (!process.env[env]) {
                    console.log(`Config::load: Env Variable "${env}" not found!`);
                    return null;
                }
            }
            const dbMysqlUsername = process.env[ENV_DUTY_DB.DB_MYSQL_USERNAME];
            const dbMysqlPassword = process.env[ENV_DUTY_DB.DB_MYSQL_PASSWORD];
            const dbMysqlDatabase = process.env[ENV_DUTY_DB.DB_MYSQL_DATABASE];
            config = {
                db: {
                    mysql: {
                        host: ConfigBackend.DEFAULT_DB_MYSQL_HOST,
                        port: ConfigBackend.DEFAULT_DB_MYSQL_PORT,
                        username: dbMysqlUsername,
                        password: dbMysqlPassword,
                        database: dbMysqlDatabase
                    },
                    redis: {
                        url: ConfigBackend.DEFAULT_REDIS_URL
                    }
                },
                httpserver: {
                    port: ConfigBackend.DEFAULT_HTTPSERVER_PORT,
                    publicdir: ConfigBackend.DEFAULT_HTTPSERVER_PUBLICDIR
                }
            };
        }
        config = this._loadEnvMariaDb(config);
        config = this._loadEnvRedisDb(config);
        config = this._loadEnvInfluxDb(config);
        config = this._loadEnvHttpserver(config);
        config = this._loadEnvLogging(config);
        return config;
    }
    _loadEnvMariaDb(config) {
        if (process.env[ENV_OPTIONAL_DB.DB_MYSQL_HOST]) {
            config.db.mysql.host = process.env[ENV_OPTIONAL_DB.DB_MYSQL_HOST];
        }
        if (process.env[ENV_OPTIONAL_DB.DB_MYSQL_PORT]) {
            config.db.mysql.port = parseInt(process.env[ENV_OPTIONAL_DB.DB_MYSQL_PORT], 10) ||
                ConfigBackend.DEFAULT_DB_MYSQL_PORT;
        }
        return config;
    }
    _loadEnvInfluxDb(config) {
        const influxEnvList = [
            ENV_OPTIONAL_DB.DB_INFLUX_URL,
            ENV_OPTIONAL_DB.DB_INFLUX_TOKEN,
            ENV_OPTIONAL_DB.DB_INFLUX_ORG,
            ENV_OPTIONAL_DB.DB_INFLUX_BUCKET
        ];
        for (const entry of influxEnvList) {
            if (process.env[entry]) {
                config.db.influx = {
                    url: '',
                    password: '',
                    username: '',
                    org: '',
                    bucket: '',
                    token: ''
                };
                break;
            }
        }
        if (config.db.influx) {
            if (process.env[ENV_OPTIONAL_DB.DB_INFLUX_URL]) {
                config.db.influx.url = process.env[ENV_OPTIONAL_DB.DB_INFLUX_URL];
            }
            if (process.env[ENV_OPTIONAL_DB.DB_INFLUX_TOKEN]) {
                config.db.influx.token = process.env[ENV_OPTIONAL_DB.DB_INFLUX_TOKEN];
            }
            if (process.env[ENV_OPTIONAL_DB.DB_INFLUX_ORG]) {
                config.db.influx.org = process.env[ENV_OPTIONAL_DB.DB_INFLUX_ORG];
            }
            if (process.env[ENV_OPTIONAL_DB.DB_INFLUX_BUCKET]) {
                config.db.influx.bucket = process.env[ENV_OPTIONAL_DB.DB_INFLUX_BUCKET];
            }
        }
        return config;
    }
    _loadEnvRedisDb(config) {
        if (config.db.redis) {
            if (process.env[ENV_OPTIONAL_DB.DB_REDIS_URL]) {
                config.db.redis.url = process.env[ENV_OPTIONAL_DB.DB_REDIS_URL];
            }
            if (process.env[ENV_OPTIONAL_DB.DB_REDIS_PASSWORD]) {
                config.db.redis.password = process.env[ENV_OPTIONAL_DB.DB_REDIS_PASSWORD];
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