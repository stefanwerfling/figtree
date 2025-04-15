import {DeleteResult, EntityTarget, Repository} from 'typeorm';
import {DBBaseEntityUnid} from './DBBaseEntityUnid.js';
import {DBHelper} from './DBHelper.js';

export abstract class DBServiceUn<T extends DBBaseEntityUnid> {

    /**
     * instance
     * @protected
     */
    protected static _instance = new Map<string, DBServiceUn<any>>();

    /**
     * repository for T
     * @private
     */
    protected readonly _repository: Repository<T>;

    /**
     * getSingleInstance
     */
    protected static getSingleInstance<I extends DBBaseEntityUnid, S extends DBServiceUn<I>>(
        tclass: new (tentrie: EntityTarget<I>) => S,
        tentrie: EntityTarget<I>,
        registerName: string
    ): S {
        let cls;

        if (DBServiceUn._instance.has(registerName)) {
            cls = DBServiceUn._instance.get(registerName);

            if (!(cls instanceof tclass)) {
                throw new Error('Class not found in register!');
            }
        } else {
            cls = new tclass(tentrie);

            DBServiceUn._instance.set(registerName, cls);
        }

        return cls;
    }

    /**
     * constructor
     * @param {DBBaseEntityUnid} target
     */
    public constructor(target: EntityTarget<T>) {
        this._repository = DBHelper.getRepository(target);
    }

    /**
     * countAll
     */
    public async countAll(): Promise<number> {
        return this._repository.count();
    }

    /**
     * findAll
     * @returns {DBBaseEntityUnid[]}
     */
    public async findAll(): Promise<T[]> {
        return this._repository.find();
    }

    /**
     * findOne
     * @param unid
     * @returns {DBBaseEntityUnid}
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