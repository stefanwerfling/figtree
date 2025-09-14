import { DBHelper } from './DBHelper.js';
export class DBRepositoryUnid {
    static _instance = new Map();
    _repository;
    static getSingleInstance(target) {
        if (!DBRepositoryUnid._instance.has(this.REGISTER_NAME)) {
            DBRepositoryUnid._instance.set(this.REGISTER_NAME, new this(target));
        }
        return DBRepositoryUnid._instance.get(this.REGISTER_NAME);
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
    async findOne(unid) {
        const repository = this._repository;
        const result = await repository.findOne({
            where: {
                unid: unid
            }
        });
        if (result) {
            return result;
        }
        return null;
    }
    async remove(unid) {
        return this._repository.delete(unid);
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
//# sourceMappingURL=DBRepositoryUnid.js.map