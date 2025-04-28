import { DataSource } from 'typeorm';
import { VersionRepository, versionsConfig } from 'typeorm-versions';
export class DBHelper {
    static _sources = new Map();
    static _useHistory = true;
    static async init(options, useHistory = true) {
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
    static getDataSource(sourceName) {
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
    static getRepository(target, sourceName) {
        const dataSource = DBHelper.getDataSource(sourceName);
        return dataSource.getRepository(target);
    }
    static getVersionRepository() {
        if (this._useHistory) {
            return VersionRepository(DBHelper.getDataSource());
        }
        return null;
    }
    static async closeAllSources() {
        for await (const [key, dataSource] of DBHelper._sources) {
            await dataSource.destroy();
            DBHelper._sources.delete(key);
        }
    }
}
//# sourceMappingURL=DBHelper.js.map