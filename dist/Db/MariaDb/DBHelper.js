import { DataSource } from 'typeorm';
export class DBHelper {
    static _sources = new Map();
    static _options = new Map();
    static _useHistory = true;
    static async init(options, useHistory = true) {
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
    static async ensureInitialized(name, retries = 5, delayMs = 3000) {
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
                }
                catch (err) {
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
    static async getDataSource(sourceName) {
        const name = sourceName || 'default';
        return await DBHelper.ensureInitialized(name);
    }
    static async getRepository(target, sourceName) {
        const dataSource = await DBHelper.getDataSource(sourceName);
        return dataSource.getRepository(target);
    }
    static async closeAllSources() {
        for await (const [key, dataSource] of DBHelper._sources) {
            await dataSource.destroy();
            DBHelper._sources.delete(key);
        }
    }
}
//# sourceMappingURL=DBHelper.js.map