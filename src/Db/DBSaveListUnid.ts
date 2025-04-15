import {DBBaseEntityUnid} from './DBBaseEntityUnid.js';
import {DBServiceUn} from './DBServiceUn.js';

/**
 * On find all
 */
export type DBSaveListUnidOnFindAllInDb<
    S extends DBServiceUn<E>,
    E extends DBBaseEntityUnid,
    MT extends string | number
> = (
    instance: S,
    mainId: MT
) => Promise<E[]>;

/**
 * On get id
 */
export type DBSaveListUnidOnGetId<
    T extends any
> = (data: T) => string;

/**
 * On fill data
 */
export type DBSaveListUnidOnFillData<
    T extends any,
    E extends DBBaseEntityUnid,
    MT extends string | number
> = (
    mainId: MT,
    entry: E|null,
    data: T
) => E;

export class DBSaveListUnid {

    public static async save<
        D extends any,
        S extends DBServiceUn<E>,
        E extends DBBaseEntityUnid,
        MT extends string | number
    >(
        mainId: MT,
        saveList: D[],
        instance: S,
        onFindAll: DBSaveListUnidOnFindAllInDb<S, E, MT>,
        onGetId: DBSaveListUnidOnGetId<D>,
        onFillData: DBSaveListUnidOnFillData<D, E, MT>
    ): Promise<void> {
        const allInDb = await onFindAll(instance, mainId);

        const dataMap: Map<string, D> = new Map<string, D>();
        const dataIds: string[] = [];

        for (const data of allInDb) {
            dataIds.push(data.unid);
        }

        // Add new or remember for data --------------------------------------------------------------------------------

        for await (const aData of saveList) {
            const tId = onGetId(aData);

            if (tId === '') {
                const newData = onFillData(mainId, null, aData);
                await instance.save(newData);
            } else {
                dataMap.set(tId, aData);
            }
        }

        // Delete old --------------------------------------------------------------------------------------------------

        for await (const dataId of dataIds) {
            if (!dataMap.has(dataId)) {
                await instance.remove(dataId);
            }
        }

        // update data -------------------------------------------------------------------------------------------------

        for await (const [, aData] of dataMap) {
            const tId = onGetId(aData);

            let dataDb = await instance.findOne(tId);

            if (dataDb) {
                dataDb = onFillData(mainId, dataDb, aData);
                await instance.save(dataDb);
            }
        }
    }

}