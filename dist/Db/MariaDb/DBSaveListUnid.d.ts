import { DBBaseEntityUnid } from './DBBaseEntityUnid.js';
import { DBServiceUn } from './DBServiceUn.js';
export type DBSaveListUnidOnFindAllInDb<S extends DBServiceUn<E>, E extends DBBaseEntityUnid, MT extends string | number> = (instance: S, mainId: MT) => Promise<E[]>;
export type DBSaveListUnidOnGetId<T extends any> = (data: T) => string;
export type DBSaveListUnidOnFillData<T extends any, E extends DBBaseEntityUnid, MT extends string | number> = (mainId: MT, entry: E | null, data: T) => E;
export declare class DBSaveListUnid {
    static save<D extends any, S extends DBServiceUn<E>, E extends DBBaseEntityUnid, MT extends string | number>(mainId: MT, saveList: D[], instance: S, onFindAll: DBSaveListUnidOnFindAllInDb<S, E, MT>, onGetId: DBSaveListUnidOnGetId<D>, onFillData: DBSaveListUnidOnFillData<D, E, MT>): Promise<void>;
}
