import {DeepPartial, DeleteResult, EntityTarget, Repository} from 'typeorm';
import {DBBaseEntityId} from './DBBaseEntityId.js';
import {DBHelper} from './DBHelper.js';

/**
 * DB Repository for id`s with type number
 * @template T
 */
export abstract class DBRepository<T extends DBBaseEntityId> {

    /**
     * instance
     * @protected
     */
    protected static _instance: Map<string, DBRepository<any>> = new Map();

    /**
     * repository for T
     * @private
     */
    protected readonly _repository: Promise<Repository<T>>;

    /**
     * Get Single Instance
     * @template S extends DBRepository
     * @template TEntity extends DBBaseEntityId
     * @return {S}
     */
    protected static getSingleInstance<S extends DBRepository<any>, TEntity extends DBBaseEntityId>(
        this: { new(target: EntityTarget<TEntity>): S; REGISTER_NAME: string },
        target: EntityTarget<TEntity>
    ): S {
        if (!DBRepository._instance.has(this.REGISTER_NAME)) {
            DBRepository._instance.set(this.REGISTER_NAME, new this(target));
        }

        return DBRepository._instance.get(this.REGISTER_NAME) as S;
    }

    /**
     * constructor
     * @param {EntityTarget<T>} target
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
     * find one entry by id
     * @param {number} id
     * @return {T|null}
     */
    public async findOne(id: number): Promise<T | null> {
        const repository = await this._repository as Repository<DBBaseEntityId>;

        const result = await repository.findOne({
            where: {
                id: id
            }
        });

        if (result) {
            return result as T;
        }

        return null;
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
     * Remove a row (entry) by ID.
     * @param {number} id - ID from entry.
     * @returns {DeleteResult}
     */
    public async remove(id: number): Promise<DeleteResult> {
        const repository = await this._repository;
        return repository.delete(id);
    }

    /**
     * Save an entry object extend from DBBaseEntityId.
     * @param {T extends DBBaseEntityId} entity
     * @returns {T}
     */
    public async save(entity: T): Promise<T> {
        const repository = await this._repository;
        return repository.save(entity);
        //return this._repository.insert(entity);
    }

    /**
     * Get access to repository for cross-query building and more.
     * @returns {Repository<T>}
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

}