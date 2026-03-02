import {BaseEntity, DeepPartial, EntityTarget, Repository} from 'typeorm';
import {DBHelper} from './DBHelper.js';

/**
 * DB Repository base
 * @template T
 */
export abstract class DBRepositoryBase<T extends BaseEntity> {

    /**
     * instance
     * @protected
     */
    protected static _instance: Map<string, DBRepositoryBase<any>> = new Map();

    /**
     * repository for T
     * @private
     */
    protected readonly _repository: Promise<Repository<T>>;

    /**
     * Get Single Instance
     * @template S extends BaseEntity
     * @template TEntity extends BaseEntity
     * @return {S}
     */
    protected static getSingleInstance<S extends DBRepositoryBase<any>, TEntity extends BaseEntity>(
        this: { new(target: EntityTarget<TEntity>): S; REGISTER_NAME: string },
        target: EntityTarget<TEntity>
    ): S {
        if (!DBRepositoryBase._instance.has(this.REGISTER_NAME)) {
            DBRepositoryBase._instance.set(this.REGISTER_NAME, new this(target));
        }

        return DBRepositoryBase._instance.get(this.REGISTER_NAME) as S;
    }

    /**
     * constructor
     * @param {BaseEntity} target
     */
    protected constructor(target: EntityTarget<T>) {
        this._repository = DBHelper.getRepository(target);
    }

    /**
     * count all entries
     * @return number
     */
    public async countAll(): Promise<number> {
        const repository = await this._repository;
        return repository.count();
    }

    /**
     * find all entries
     * @return {T[]}
     */
    public async findAll(): Promise<T[]> {
        const repository = await this._repository;
        return repository.find();
    }

    /**
     * Get access to repository for cross-query building and more.
     * @returns {Repository<BaseEntity>}
     */
    public async getRepository(): Promise<Repository<T>> {
        return this._repository;
    }

    /**
     * Return the table name.
     * @returns {string}
     */
    public async getTableName(): Promise<string> {
        const repository = await this._repository;
        return repository.metadata.name;
    }

    /**
     * Create an entity (only create an instance)
     * @param {DeepPartial<T>} entityLike
     * @return {T}
     */
    public async createEntity(entityLike: DeepPartial<T>): Promise<T> {
        const repository = await this._repository;
        return repository.create(entityLike);
    }

    /**
     * Save an entry object extend from BaseEntity.
     * @param {T} entity
     * @returns {T}
     */
    public async save(entity: T): Promise<T> {
        const repository = await this._repository;
        return repository.save(entity);
    }
}