import {EntitySchema, MixedList} from 'typeorm';

/**
 * Class constructor type used by TypeORM for entity / migration classes.
 */
type EntityClass = new (...args: any[]) => any;

/**
 * DB Loader
 */
export class DBLoader {

    /**
     * load Entities
     * @return {MixedList<EntityClass | string | EntitySchema>}
     */
    public static async loadEntities(): Promise<MixedList<EntityClass | string | EntitySchema>> {
        throw new Error('DBLoader::loadEntities: please set your own class!');
    }

    /**
     * load Migrations
     * @return {MixedList<EntityClass | string>|undefined}
     */
    public static loadMigrations(): MixedList<EntityClass | string>|undefined {
        throw new Error('DBLoader::loadMigrations: please set your own class!');
    }

}

/**
 * DB Loader Type
 */
export type DBLoaderType = { new(): DBLoader;

    /**
     * load Entities
     * @return {MixedList<EntityClass | string | EntitySchema>}
     */
    loadEntities(): Promise<MixedList<EntityClass | string | EntitySchema>>;

    /**
     * load Migrations
     * @return {MixedList<EntityClass | string>|undefined}
     */
    loadMigrations(): MixedList<EntityClass | string>|undefined;

};