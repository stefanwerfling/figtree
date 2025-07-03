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
    protected static _instance = new Map<string, DBRepository<any>>();

    /**
     * repository for T
     * @private
     */
    protected readonly _repository: Repository<T>;

    /**
     * Get Single Instance
     * @template I extends DBBaseEntityId
     * @template S extends DBRepository<I>
     * @param {new (tentrie: EntityTarget<I>) => S} tclass
     * @param {EntityTarget} tentrie
     * @param {string} registerName
     * @return {S}
     */
    protected static getSingleInstance<I extends DBBaseEntityId, S extends DBRepository<I>>(
        tclass: new (tentrie: EntityTarget<I>) => S,
        tentrie: EntityTarget<I>,
        registerName: string
    ): S {
        let cls;

        if (DBRepository._instance.has(registerName)) {
            cls = DBRepository._instance.get(registerName);

            if (!(cls instanceof tclass)) {
                throw new Error('Class not found in register!');
            }
        } else {
            cls = new tclass(tentrie);

            DBRepository._instance.set(registerName, cls);
        }

        return cls;
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