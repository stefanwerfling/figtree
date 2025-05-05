export class DBSaveListUnid {
    static async save(mainId, saveList, instance, onFindAll, onGetId, onFillData) {
        const allInDb = await onFindAll(instance, mainId);
        const dataMap = new Map();
        const dataIds = [];
        for (const data of allInDb) {
            dataIds.push(data.unid);
        }
        for await (const aData of saveList) {
            const tId = onGetId(aData);
            if (tId === '') {
                const newData = onFillData(mainId, null, aData);
                await instance.save(newData);
            }
            else {
                dataMap.set(tId, aData);
            }
        }
        for await (const dataId of dataIds) {
            if (!dataMap.has(dataId)) {
                await instance.remove(dataId);
            }
        }
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
//# sourceMappingURL=DBSaveListUnid.js.map