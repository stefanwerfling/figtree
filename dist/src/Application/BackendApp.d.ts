import { Schema } from 'vts';
import { Config } from '../Config/Config.js';
import { DBEntitiesLoaderType } from '../Db/MariaDb/DBEntitiesLoader.js';
import { RedisChannel } from '../Db/RedisDb/RedisChannel.js';
import { DefaultArgs } from '../Schemas/Args/DefaultArgs.js';
import { ConfigOptions } from '../Schemas/Config/ConfigOptions.js';
export declare abstract class BackendApp<A extends DefaultArgs, C extends ConfigOptions> {
    protected _appName: string;
    protected _args: A | null;
    protected _getArgSchema(): Schema<A> | null;
    protected _getConfigInstance(): Config<C>;
    protected _loadCofig(): Promise<boolean>;
    protected _initLogger(): void;
    start(): Promise<void>;
    protected _startMariaDBService(entitiesLoader: DBEntitiesLoaderType): Promise<boolean>;
    protected _startInfluxDBService(): Promise<boolean>;
    protected _startRedisDBService(channels: RedisChannel<any>[]): Promise<boolean>;
    protected _startServices(): Promise<void>;
}
