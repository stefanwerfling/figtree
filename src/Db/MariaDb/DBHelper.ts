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
            // sequential by design — retry loop with backoff between attempts
            /* eslint-disable no-await-in-loop */
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

                    await new Promise<void>((resolve) => {
                        setTimeout(resolve, delayMs);
                    });
                }
            }
            /* eslint-enable no-await-in-loop */
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
     * Run pending migrations on a data source.
     *
     * When a baseline is provided and a legacy schema is detected (the legacy
     * table exists), the baseline migration is stamped as already applied
     * instead of being executed — unless it is already stamped. The check is
     * keyed on the baseline migration ROW, so a pre-existing (possibly empty)
     * `migrations` table does not defeat it. This lets existing databases
     * (whose schema was created by a former `synchronize: true`) adopt
     * migrations without recreating their schema.
     *
     * The DataSource must have been initialized with `migrationsRun: false`, so
     * the stamping happens before any migration is run.
     * @param {string} [sourceName] - data source name (defaults to `default`)
     * @param {{legacyTable: string; migrationName: string; timestamp: number}} [baseline] - auto-baseline descriptor for pre-existing schemas
     */
    public static async runMigrations(
        sourceName?: string,
        baseline?: {legacyTable: string; migrationName: string; timestamp: number;}
    ): Promise<void> {
        const dataSource = await DBHelper.getDataSource(sourceName);

        if (baseline) {
            const legacy = await dataSource.query(`SHOW TABLES LIKE '${baseline.legacyTable}'`);

            if (legacy.length > 0) {
                // Legacy schema present (built by a former `synchronize: true`).
                // Make sure the `migrations` table exists so we can stamp the
                // baseline. TypeORM would create it lazily, but we need it
                // before `runMigrations()` so the stamp lands first.
                const migrationsTable = await dataSource.query('SHOW TABLES LIKE \'migrations\'');

                if (migrationsTable.length === 0) {
                    await dataSource.query('CREATE TABLE `migrations` (`id` int NOT NULL AUTO_INCREMENT, `timestamp` bigint NOT NULL, `name` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB');
                }

                // Stamp the baseline as applied, keyed on the baseline ROW — not
                // on the mere existence of the `migrations` table. A leftover
                // empty `migrations` table (e.g. from an earlier aborted boot,
                // where TypeORM auto-created it via non-rollbackable DDL before
                // the first migration failed) would otherwise slip past the old
                // table-existence check and re-run the baseline CREATE
                // statements against an already-populated schema.
                const stamped = await dataSource.query(
                    'SELECT 1 FROM `migrations` WHERE `name` = ? LIMIT 1',
                    [baseline.migrationName]
                );

                if (stamped.length === 0) {
                    await dataSource.query('INSERT INTO `migrations`(`timestamp`, `name`) VALUES (?, ?)', [baseline.timestamp, baseline.migrationName]);
                }
            }
        }

        await dataSource.runMigrations();
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