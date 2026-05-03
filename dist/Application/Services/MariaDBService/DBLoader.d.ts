import { EntitySchema, MixedList } from 'typeorm';
type EntityClass = new (...args: any[]) => any;
export declare class DBLoader {
    static loadEntities(): Promise<MixedList<EntityClass | string | EntitySchema>>;
    static loadMigrations(): MixedList<EntityClass | string> | undefined;
}
export type DBLoaderType = {
    new (): DBLoader;
    loadEntities(): Promise<MixedList<EntityClass | string | EntitySchema>>;
    loadMigrations(): MixedList<EntityClass | string> | undefined;
};
export {};
