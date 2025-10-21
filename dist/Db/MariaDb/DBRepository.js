import { DBHelper } from './DBHelper.js';
export class DBRepository {
    static _instance = new Map();
    _repository;
    static getSingleInstance(target) {
        if (!DBRepository._instance.has(this.REGISTER_NAME)) {
            DBRepository._instance.set(this.REGISTER_NAME, new this(target));
        }
        return DBRepository._instance.get(this.REGISTER_NAME);
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
    async createEntity(entityLike) {
        return this._repository.create();
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