import {EntitySchema, MixedList} from 'typeorm';

/**
 * DB Loader
 */
export class DBLoader {

    /**
     * load Entities
     * @return {MixedList<Function | string | EntitySchema>}
     */
    public static async loadEntities(): Promise<MixedList<Function | string | EntitySchema>> {
        throw new Error('DBLoader::loadEntities: please set your own class!');
    }

    /**
     * load Migrations
     * @return {MixedList<Function | string> }
     */
    public static loadMigrations(): MixedList<Function | string> {
        throw new Error('DBLoader::loadMigrations: please set your own class!');
    }
}

/**
 * DB Loader Type
 */
export type DBLoaderType = { new(): DBLoader;

    /**
     * load Entities
     * @return {MixedList<Function | string | EntitySchema>}
     */
    loadEntities(): Promise<MixedList<Function | string | EntitySchema>>;

    /**
     * load Migrations
     * @return {MixedList<Function | string> }
     */
    loadMigrations(): MixedList<Function | string>;
};