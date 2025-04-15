import { DBBaseEntityId } from './DBBaseEntityId.js';
import { DBService } from './DBService.js';
export type DBSaveListIdOnFindAllInDb<S extends DBService<E>, E extends DBBaseEntityId, MT extends string | number> = (instance: S, mainId: MT) => Promise<E[]>;
export type DBSaveListIdOnGetId<T extends any> = (data: T) => number;
export type DBSaveListIdOnFillData<T extends any, E extends DBBaseEntityId, MT extends string | number> = (mainId: MT, entry: E | null, data: T) => E;
export declare class DBSaveListId {
    static save<D extends any, S extends DBService<E>, E extends DBBaseEntityId, MT extends string | number>(mainId: MT, saveList: D[], instance: S, onFindAll: DBSaveListIdOnFindAllInDb<S, E, MT>, onGetId: DBSaveListIdOnGetId<D>, onFillData: DBSaveListIdOnFillData<D, E, MT>): Promise<void>;
}
