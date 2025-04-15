import { EntitySchema, MixedList } from 'typeorm';
export declare class DBEntitiesLoader {
    static loadEntities(): Promise<MixedList<Function | string | EntitySchema>>;
}
export type DBEntitiesLoaderType = {
    new (): DBEntitiesLoader;
    loadEntities(): Promise<MixedList<Function | string | EntitySchema>>;
};
