import { DataSource, DataSourceOptions, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { Version } from 'typeorm-versions';
export declare class DBHelper {
    protected static _sources: Map<string, DataSource>;
    static _useHistory: boolean;
    static init(options: DataSourceOptions, useHistory?: boolean): Promise<void>;
    static getDataSource(sourceName?: string): DataSource;
    static getRepository<Entity extends ObjectLiteral>(target: EntityTarget<Entity>, sourceName?: string): Repository<Entity>;
    static getVersionRepository(): Repository<Version> | null;
    static closeAllSources(): Promise<void>;
}
