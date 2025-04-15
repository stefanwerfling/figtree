import {EntitySchema, MixedList} from 'typeorm';

/**
 * DBEntitiesLoader
 */
export class DBEntitiesLoader {

    public static async loadEntities(): Promise<MixedList<Function | string | EntitySchema>> {
        throw new Error('DBEntitiesLoader::loadEntities: please set your own class!');
    }
}

/**
 * Class Type
 */
export type DBEntitiesLoaderType = { new(): DBEntitiesLoader;
    loadEntities(): Promise<MixedList<Function | string | EntitySchema>>;
};