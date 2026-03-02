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
        const repository = await this._repository;
        return repository.count();
    }
    async findAll() {
        const repository = await this._repository;
        return repository.find();
    }
    async findOne(unid) {
        const repository = await this._repository;
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
    async createEntity(entityLike) {
        const repository = await this._repository;
        return repository.create(entityLike);
    }
    async remove(unid) {
        const repository = await this._repository;
        return repository.delete(unid);
    }
    async save(entity) {
        const repository = await this._repository;
        return repository.save(entity);
    }
    async getRepository() {
        return this._repository;
    }
    async getTableName() {
        const repository = await this._repository;
        return repository.metadata.name;
    }
}
//# sourceMappingURL=DBRepositoryUnid.js.map