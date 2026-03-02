import { DataSource, DataSourceOptions, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
export declare class DBHelper {
    protected static _sources: Map<string, DataSource>;
    protected static _options: Map<string, DataSourceOptions>;
    static _useHistory: boolean;
    static init(options: DataSourceOptions, useHistory?: boolean): Promise<void>;
    private static ensureInitialized;
    static getDataSource(sourceName?: string): Promise<DataSource>;
    static getRepository<Entity extends ObjectLiteral>(target: EntityTarget<Entity>, sourceName?: string): Promise<Repository<Entity>>;
    static closeAllSources(): Promise<void>;
}
