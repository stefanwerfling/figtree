import { DataSource, DataSourceOptions, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
export declare class DBHelper {
    protected static _sources: Map<string, DataSource>;
    static _useHistory: boolean;
    static init(options: DataSourceOptions, useHistory?: boolean): Promise<void>;
    static getDataSource(sourceName?: string): DataSource;
    static getRepository<Entity extends ObjectLiteral>(target: EntityTarget<Entity>, sourceName?: string): Repository<Entity>;
    static closeAllSources(): Promise<void>;
}
