import { EntitySchema, MixedList } from 'typeorm';
export declare class DBLoader {
    static loadEntities(): Promise<MixedList<Function | string | EntitySchema>>;
    static loadMigrations(): MixedList<Function | string>;
}
export type DBLoaderType = {
    new (): DBLoader;
    loadEntities(): Promise<MixedList<Function | string | EntitySchema>>;
    loadMigrations(): MixedList<Function | string>;
};
