import {BaseEntity, EntityTarget, Repository} from 'typeorm';
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
    protected readonly _repository: Repository<T>;

    /**
     * Get Single Instance
     * @template S extends DBRepositoryUnid
     * @template TEntity extends DBBaseEntityUnid
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