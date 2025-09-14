import {DeleteResult, EntityTarget, Repository} from 'typeorm';
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
    protected readonly _repository: Repository<T>;

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
        return this._repository.count();
    }

    /**
     * find all entries
     * @return {T[]}
     */
    public async findAll(): Promise<T[]> {
        return this._repository.find();
    }

    /**
     * find one entry by id
     * @param {number} id
     * @return {T|null}
     */
    public async findOne(id: number): Promise<T | null> {
        const repository = this._repository as Repository<DBBaseEntityId>;

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
     * Remove a row (entry) by ID.
     * @param {number} id - ID from entry.
     * @returns {DeleteResult}
     */
    public async remove(id: number): Promise<DeleteResult> {
        return this._repository.delete(id);
    }

    /**
     * Save an entry object extend from DBBaseEntityId.
     * @param {T extends DBBaseEntityId} entity
     * @returns {T}
     */
    public async save(entity: T): Promise<T> {
        return this._repository.save(entity);
        //return this._repository.insert(entity);
    }

    /**
     * Get access to repository for cross-query building and more.
     * @returns {Repository<T>}
     */
    public getRepository(): Repository<T> {
        return this._repository;
    }

    /**
     * Return the table name.
     * @returns {string}
     */
    public getTableName(): string {
        return this._repository.metadata.name;
    }

}