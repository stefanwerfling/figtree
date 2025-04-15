import {
    DataSource,
    DataSourceOptions,
    EntityTarget,
    ObjectLiteral,
    Repository
} from 'typeorm';
import {Version, VersionRepository, versionsConfig} from 'typeorm-versions';

/**
 * Database helper
 */
export class DBHelper {

    /**
     * data sources
     * @protected
     */
    protected static _sources: Map<string, DataSource> = new Map();

    /**
     * Use DB History
     */
    public static _useHistory: boolean = true;

    /**
     * init the database connection
     * @param {DataSourceOptions} options
     * @param {boolean} useHistory
     */
    public static async init(options: DataSourceOptions, useHistory: boolean = true): Promise<void> {
        this._useHistory = useHistory;

        let dbOptions = options;

        if (this._useHistory) {
            dbOptions = versionsConfig(dbOptions);
        }

        const dataSource = new DataSource(dbOptions);
        await dataSource.initialize();

        let name = 'default';

        if (options.name) {
            name = options.name;
        }

        DBHelper._sources.set(name, dataSource);
    }

    /**
     * return the data source
     * @param {string} sourceName
     * @returns {DataSource}
     */
    public static getDataSource(sourceName?: string): DataSource {
        let name = 'default';

        if (sourceName) {
            name = sourceName;
        }

        const dataSource = DBHelper._sources.get(name);

        if (!dataSource) {
            throw new Error('Datasource is empty');
        }

        return dataSource;
    }

    /**
     * return the repository
     * @param {EntityTarget} target
     * @param {string} sourceName
     */
    public static getRepository<Entity extends ObjectLiteral>(target: EntityTarget<Entity>, sourceName?: string): Repository<Entity> {
        const dataSource = DBHelper.getDataSource(sourceName);
        return dataSource.getRepository(target);
    }

    /**
     * Return the version repository
     * @returns {Repository<Version>|null}
     */
    public static getVersionRepository(): Repository<Version>|null {
        if (this._useHistory) {
            return VersionRepository(DBHelper.getDataSource());
        }

        return null;
    }

}