import {DBBaseEntityId} from './DBBaseEntityId.js';
import {DBService} from './DBService.js';

/**
 * On find all
 */
export type DBSaveListIdOnFindAllInDb<
    S extends DBService<E>,
    E extends DBBaseEntityId,
    MT extends string | number
> = (
    instance: S,
    mainId: MT
) => Promise<E[]>;

/**
 * On get id
 */
export type DBSaveListIdOnGetId<
    T extends any
> = (data: T) => number;

/**
 * On fill data
 */
export type DBSaveListIdOnFillData<
    T extends any,
    E extends DBBaseEntityId,
    MT extends string | number
> = (
    mainId: MT,
    entry: E|null,
    data: T
) => E;

/**
 * DB Save List Id
 */
export class DBSaveListId {

    public static async save<
        D extends any,
        S extends DBService<E>,
        E extends DBBaseEntityId,
        MT extends string | number
    >(
        mainId: MT,
        saveList: D[],
        instance: S,
        onFindAll: DBSaveListIdOnFindAllInDb<S, E, MT>,
        onGetId: DBSaveListIdOnGetId<D>,
        onFillData: DBSaveListIdOnFillData<D, E, MT>
    ): Promise<void> {
        const allInDb = await onFindAll(instance, mainId);

        const dataMap: Map<number, D> = new Map<number, D>();
        const dataIds: number[] = [];

        for (const data of allInDb) {
            dataIds.push(data.id);
        }

        // Add new or remember for data --------------------------------------------------------------------------------

        for await (const aData of saveList) {
            const tId = onGetId(aData);

            if (tId === 0) {
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