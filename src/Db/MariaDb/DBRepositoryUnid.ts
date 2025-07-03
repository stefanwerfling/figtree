import {DeleteResult, EntityTarget, Repository} from 'typeorm';
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
    protected static _instance = new Map<string, DBRepositoryUnid<any>>();

    /**
     * repository for T
     * @private
     */
    protected readonly _repository: Repository<T>;

    /**
     * Get Single Instance
     * @template I extends DBBaseEntityUnid
     * @template S extends DBRepositoryUnid<I>
     * @param {new (tentrie: EntityTarget<I>) => S} tclass
     * @param {EntityTarget} tentrie
     * @param {string} registerName
     * @return {S}
     */
    protected static getSingleInstance<I extends DBBaseEntityUnid, S extends DBRepositoryUnid<I>>(
        tclass: new (tentrie: EntityTarget<I>) => S,
        tentrie: EntityTarget<I>,
        registerName: string
    ): S {
        let cls;

        if (DBRepositoryUnid._instance.has(registerName)) {
            cls = DBRepositoryUnid._instance.get(registerName);

            if (!(cls instanceof tclass)) {
                throw new Error('Class not found in register!');
            }
        } else {
            cls = new tclass(tentrie);

            DBRepositoryUnid._instance.set(registerName, cls);
        }

        return cls;
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