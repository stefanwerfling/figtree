import { DBHelper } from './DBHelper.js';
export class DBRepositoryBase {
    static _instance = new Map();
    _repository;
    static getSingleInstance(target) {
        if (!DBRepositoryBase._instance.has(this.REGISTER_NAME)) {
            DBRepositoryBase._instance.set(this.REGISTER_NAME, new this(target));
        }
        return DBRepositoryBase._instance.get(this.REGISTER_NAME);
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
    getRepository() {
        return this._repository;
    }
    getTableName() {
        return this._repository.metadata.name;
    }
    async createEntity(entityLike) {
        return this._repository.create(entityLike);
    }
    async save(entity) {
        return this._repository.save(entity);
    }
}
//# sourceMappingURL=DBRepositoryBase.js.map