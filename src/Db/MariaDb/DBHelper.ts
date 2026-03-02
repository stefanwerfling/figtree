import {
    DataSource,
    DataSourceOptions,
    EntityTarget,
    ObjectLiteral,
    Repository
} from 'typeorm';

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
     * options (for reconnect)
     * @protected
     */
    protected static _options: Map<string, DataSourceOptions> = new Map();

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

        let name = 'default';

        if (options.name) {
            name = options.name;
        }

        DBHelper._options.set(name, options);

        const dataSource = new DataSource(options);
        await dataSource.initialize();

        DBHelper._sources.set(name, dataSource);
    }

    private static async ensureInitialized(
        name: string,
        retries = 5,
        delayMs = 3000
    ): Promise<DataSource> {
        let dataSource = DBHelper._sources.get(name);

        if (!dataSource) {
            const options = DBHelper._options.get(name);

            if (!options) {
                throw new Error(`No DataSourceOptions found for '${name}'`);
            }

            dataSource = new DataSource(options);
            DBHelper._sources.set(name, dataSource);
        }

        if (!dataSource.isInitialized) {
            for (let i = 0; i < retries; i++) {
                try {
                    await dataSource.initialize();

                    console.log(`✅ DataSource '${name}' re-initialized`);

                    return dataSource;
                } catch (err) {
                    console.warn(`⚠️ Reconnect attempt ${i + 1}/${retries} failed for '${name}'`);

                    if (i === retries - 1) {
                        throw err;
                    }

                    await new Promise(r => setTimeout(r, delayMs));
                }
            }
        }

        return dataSource;
    }

    /**
     * return the data source
     * @param {string} sourceName
     * @returns {DataSource}
     */
    public static async getDataSource(sourceName?: string): Promise<DataSource> {
        const name = sourceName || 'default';
        return await DBHelper.ensureInitialized(name);
    }

    /**
     * return the repository
     * @param {EntityTarget} target
     * @param {string} sourceName
     */
    public static async getRepository<Entity extends ObjectLiteral>(target: EntityTarget<Entity>, sourceName?: string): Promise<Repository<Entity>> {
        const dataSource = await DBHelper.getDataSource(sourceName);
        return dataSource.getRepository(target);
    }

    /**
     * Close all sources connection
     */
    public static async closeAllSources(): Promise<void> {
        for await (const [key, dataSource] of DBHelper._sources) {
            await dataSource.destroy();
            DBHelper._sources.delete(key);
        }
    }
}