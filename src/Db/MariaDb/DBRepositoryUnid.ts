import {DeepPartial, DeleteResult, EntityTarget, Repository} from 'typeorm';
import {DBBaseEntityUnid} from './DBBaseEntityUnid.js';
import {DBHelper} from './DBHelper.js';

/**
 * DB Repository for unid`s with type string
 * @template T
 */
export abstract class DBRepositoryUnid<T extends DBBaseEntityUnid> {

    /**
     * instance
     * @protected
     */
    protected static _instance: Map<string, DBRepositoryUnid<any>> = new Map();

    /**
     * repository for T
     * @private
     */
    protected readonly _repository: Repository<T>;

    /**
     * Get Single Instance
     * @template S extends DBRepositoryUnid
     * @template TEntityUnid extends DBBaseEntityUnid
     * @return {S}
     */
    protected static getSingleInstance<S extends DBRepositoryUnid<any>, TEntityUnid extends DBBaseEntityUnid>(
        this: { new(target: EntityTarget<TEntityUnid>): S; REGISTER_NAME: string },
        target: EntityTarget<TEntityUnid>
    ): S {
        if (!DBRepositoryUnid._instance.has(this.REGISTER_NAME)) {
            DBRepositoryUnid._instance.set(this.REGISTER_NAME, new this(target));
        }

        return DBRepositoryUnid._instance.get(this.REGISTER_NAME) as S;
    }

    /**
     * constructor
     * @param {DBBaseEntityUnid} target
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
     * @param {string} unid
     * @return {T|null}
     */
    public async findOne(unid: string): Promise<T | null> {
        const repository = this._repository as Repository<DBBaseEntityUnid>;

        const result = await repository.findOne({
            where: {
                unid: unid
            }
        });

        if (result) {
            return result as T;
        }

        return null;
    }

    /**
     * Create a entity (only create an instance)
     * @param {DeepPartial<T>} entityLike
     * @return {T}
     */
    public async createEntity(entityLike: DeepPartial<T>): Promise<T> {
        return this._repository.create(entityLike);
    }

    /**
     * Remove a row (entry) by ID.
     * @param {string} unid - ID from entry.
     * @returns {DeleteResult}
     */
    public async remove(unid: string): Promise<DeleteResult> {
        return this._repository.delete(unid);
    }

    /**
     * Save an entry object extend from DBBaseEntityId.
     * @param {T extend DBBaseEntityUnid} entity
     * @returns {T extend DBBaseEntityUnid}
     */
    public async save(entity: T): Promise<T> {
        return this._repository.save(entity);
    }

    /**
     * Get access to repository for cross-query building and more.
     * @returns {Repository<DBBaseEntityUnid>}
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