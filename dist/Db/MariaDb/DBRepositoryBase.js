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
        const repository = await this._repository;
        return repository.count();
    }
    async findAll() {
        const repository = await this._repository;
        return repository.find();
    }
    async getRepository() {
        return this._repository;
    }
    async getTableName() {
        const repository = await this._repository;
        return repository.metadata.name;
    }
    async createEntity(entityLike) {
        const repository = await this._repository;
        return repository.create(entityLike);
    }
    async save(entity) {
        const repository = await this._repository;
        return repository.save(entity);
    }
}
//# sourceMappingURL=DBRepositoryBase.js.map