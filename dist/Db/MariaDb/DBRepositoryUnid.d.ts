import { DeleteResult, EntityTarget, Repository } from 'typeorm';
import { DBBaseEntityUnid } from './DBBaseEntityUnid.js';
export declare abstract class DBRepositoryUnid<T extends DBBaseEntityUnid> {
    protected static _instance: Map<string, DBRepositoryUnid<any>>;
    protected readonly _repository: Repository<T>;
    protected static getSingleInstance<I extends DBBaseEntityUnid, S extends DBRepositoryUnid<I>>(tclass: new (tentrie: EntityTarget<I>) => S, tentrie: EntityTarget<I>, registerName: string): S;
    protected constructor(target: EntityTarget<T>);
    countAll(): Promise<number>;
    findAll(): Promise<T[]>;
    findOne(unid: string): Promise<T | null>;
    remove(unid: string): Promise<DeleteResult>;
    save(entity: T): Promise<T>;
    getRepository(): Repository<T>;
    getTableName(): string;
}
