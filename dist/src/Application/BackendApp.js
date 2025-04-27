import path from 'path';
import { v4 as uuid } from 'uuid';
import { Config } from '../Config/Config.js';
import { ConfigBackend } from '../Config/ConfigBackend.js';
import { DBHelper } from '../Db/MariaDb/DBHelper.js';
import { InfluxDbHelper } from '../Db/InfluxDb/InfluxDbHelper.js';
import { RedisClient } from '../Db/RedisDb/RedisClient.js';
import { RedisSubscribe } from '../Db/RedisDb/RedisSubscribe.js';
import { Args } from '../Env/Args.js';
import { Logger } from '../Logger/Logger.js';
import { SchemaConfigBackendOptions } from '../Schemas/Config/ConfigBackendOptions.js';
import { HttpServer } from '../Server/HttpServer/HttpServer.js';
import { FileHelper } from '../Utils/FileHelper.js';
import exitHook from 'async-exit-hook';
export class BackendApp {
    _appName = 'figstree';
    _args = null;
    _getArgSchema() {
        return null;
    }
    _getConfigInstance() {
        return ConfigBackend.getInstance();
    }
    async _loadCofig() {
        const argSchema = this._getArgSchema();
        let configfile = null;
        if (argSchema !== null) {
            this._args = Args.get(argSchema);
            if (this._args.config) {
                configfile = this._args.config;
                try {
                    if (!await FileHelper.fileExist(configfile)) {
                        console.log(`Config not found: ${configfile}, exit.`);
                        return false;
                    }
                }
                catch (err) {
                    console.log(`Config is not load: ${configfile}, exit.`);
                    console.error(err);
                    return false;
                }
            }
        }
        if (configfile === null) {
            const defaultConfig = path.join(path.resolve(), `/${Config.DEFAULT_CONFIG_FILE}`);
            if (await FileHelper.fileExist(defaultConfig)) {
                console.log(`Found and use setup config: ${defaultConfig} ....`);
                configfile = defaultConfig;
            }
        }
        let useEnv = false;
        if (this._args) {
            if (this._args.envargs && this._args.envargs === '1') {
                useEnv = true;
            }
        }
        const tConfig = await this._getConfigInstance().load(configfile, useEnv);
        if (tConfig === null) {
            console.log(`Configloader is return empty config, please check your configfile: ${configfile}`);
            return false;
        }
        return true;
    }
    _initLogger() {
        Logger.getLogger();
    }
    async start() {
        if (!await this._loadCofig()) {
            return;
        }
        this._initLogger();
        Logger.getLogger().info('Start %s Service ...', Config.getInstance().getAppName());
        process.on('uncaughtException', (err) => {
            Logger.getLogger().error(err);
        });
        process.on('unhandledRejection', (reason, promise) => {
            Logger.getLogger().error(reason);
            Logger.getLogger().error(promise);
        });
        exitHook(async (callback) => {
            try {
                Logger.getLogger().info('Stop %s Service ...', Config.getInstance().getAppName());
                Logger.getLogger().info('... End.');
            }
            catch (e) {
                Logger.getLogger().error("Error during shutdown:", e);
                console.trace();
            }
            finally {
                callback();
            }
        });
        await this._startServices();
    }
    async _startMariaDBService(loader) {
        try {
            const tConfig = Config.getInstance().get();
            if (tConfig === null) {
                Logger.getLogger().error('Error while connecting to the MariaDB, check your config file exist!');
                return false;
            }
            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                Logger.getLogger().error('Error while connecting to the MariaDB, check your config is correct setup!');
                return false;
            }
            await DBHelper.init({
                type: 'mysql',
                host: tConfig.db.mysql.host,
                port: tConfig.db.mysql.port,
                username: tConfig.db.mysql.username,
                password: tConfig.db.mysql.password,
                database: tConfig.db.mysql.database,
                entities: await loader.loadEntities(),
                migrations: loader.loadMigrations(),
                migrationsRun: true,
                synchronize: true
            });
        }
        catch (error) {
            Logger.getLogger().error('Error while connecting to the MariaDB: %s', error);
            return false;
        }
        return true;
    }
    async _startInfluxDBService() {
        try {
            const tConfig = Config.getInstance().get();
            if (tConfig === null) {
                Logger.getLogger().error('Error while connecting to the InfluxDB, check your config file exist!');
                return false;
            }
            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                Logger.getLogger().error('Error while connecting to the InfluxDB, check your config is correct setup!');
                return false;
            }
            if (tConfig.db.influx) {
                await InfluxDbHelper.init({
                    url: tConfig.db.influx.url,
                    token: tConfig.db.influx.token,
                    org: tConfig.db.influx.org,
                    bucket: tConfig.db.influx.bucket
                });
            }
        }
        catch (error) {
            Logger.getLogger().error('Error while connecting to the InfluxDB: %s', error);
            return false;
        }
        return true;
    }
    async _startRedisDBService(channels) {
        try {
            const tConfig = Config.getInstance().get();
            if (tConfig === null) {
                Logger.getLogger().error('Error while connecting to the RedisDB, check your config file exist!');
                return false;
            }
            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                Logger.getLogger().error('Error while connecting to the RedisDB, check your config is correct setup!');
                return false;
            }
            if (tConfig.db.redis && tConfig.db.redis.url) {
                const redisSubscribe = RedisSubscribe.getInstance({
                    url: tConfig.db.redis.url,
                    password: tConfig.db.redis.password
                }, true);
                const redisClient = RedisClient.getInstance();
                await redisClient.connect();
                await redisSubscribe.connect();
                await redisSubscribe.registerChannels(channels);
            }
            else {
                Logger.getLogger().error('Error while connecting to the RedisDB, check your config is empty!');
                return false;
            }
        }
        catch (error) {
            Logger.getLogger().error('Error while connecting to the RedisDB: %s', error);
            return false;
        }
        return true;
    }
    async _startHttpServerService(loader) {
        try {
            const tConfig = Config.getInstance().get();
            if (tConfig === null) {
                Logger.getLogger().error('Error while create the HTTPServer, check your config file exist!');
                return false;
            }
            if (!SchemaConfigBackendOptions.validate(tConfig, [])) {
                Logger.getLogger().error('Error while create the HTTPServer, check your config is correct setup!');
                return false;
            }
            let aport = 3000;
            let public_dir = '';
            let ssl_path = '';
            let session_secret = uuid();
            let session_cookie_path = '/';
            let session_cookie_max_age = 6000000;
            if (tConfig.httpserver) {
                if (tConfig.httpserver.port) {
                    aport = tConfig.httpserver.port;
                }
                if (tConfig.httpserver.publicdir) {
                    public_dir = tConfig.httpserver.publicdir;
                }
                if (tConfig.httpserver.session) {
                    if (tConfig.httpserver.session.secret) {
                        session_secret = tConfig.httpserver.session.secret;
                    }
                    if (tConfig.httpserver.session.cookie_path) {
                        session_cookie_path = tConfig.httpserver.session.cookie_path;
                    }
                    if (tConfig.httpserver.session.cookie_max_age) {
                        session_cookie_max_age = tConfig.httpserver.session.cookie_max_age;
                    }
                }
                if (tConfig.httpserver.sslpath) {
                    ssl_path = tConfig.httpserver.sslpath;
                }
            }
            const mServer = new HttpServer({
                realm: Config.getInstance().getAppTitle(),
                port: aport,
                session: {
                    secret: session_secret,
                    cookie_path: session_cookie_path,
                    ssl_path: ssl_path,
                    max_age: session_cookie_max_age
                },
                routes: await loader.loadRoutes(),
                publicDir: public_dir,
                crypt: {
                    sslPath: ssl_path,
                    key: 'server.pem',
                    crt: 'server.crt'
                }
            });
            await mServer.listen();
        }
        catch (error) {
            Logger.getLogger().error('Error while create the HTTPServer: %s', error);
            return false;
        }
        return true;
    }
    async _startServices() {
        Logger.getLogger().info('Start %s Service ...', Config.getInstance().getAppName());
    }
}
//# sourceMappingURL=BackendApp.js.map