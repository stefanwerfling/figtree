import { DBHelper } from './DBHelper.js';
export class DBRepository {
    static _instance = new Map();
    _repository;
    static getSingleInstance(tclass, tentrie, registerName) {
        let cls;
        if (DBRepository._instance.has(registerName)) {
            cls = DBRepository._instance.get(registerName);
            if (!(cls instanceof tclass)) {
                throw new Error('Class not found in register!');
            }
        }
        else {
            cls = new tclass(tentrie);
            DBRepository._instance.set(registerName, cls);
        }
        return cls;
    }
    constructor(target) {
        this._repository = DBHelper.getRepository(target);
    }
    async countAll() {
        return this._repository.count();
    }
    async findAll() {
        return this._repository.find();
    }
    async findOne(id) {
        const repository = this._repository;
        const result = await repository.findOne({
            where: {
                id: id
            }
        });
        if (result) {
            return result;
        }
        return null;
    }
    async remove(id) {
        return this._repository.delete(id);
    }
    async save(entity) {
        return this._repository.save(entity);
    }
    getRepository() {
        return this._repository;
    }
    getTableName() {
        return this._repository.metadata.name;
    }
}
//# sourceMappingURL=DBRepository.js.map