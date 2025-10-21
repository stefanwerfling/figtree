import { DeepPartial, DeleteResult, EntityTarget, Repository } from 'typeorm';
import { DBBaseEntityUnid } from './DBBaseEntityUnid.js';
export declare abstract class DBRepositoryUnid<T extends DBBaseEntityUnid> {
    protected static _instance: Map<string, DBRepositoryUnid<any>>;
    protected readonly _repository: Repository<T>;
    protected static getSingleInstance<S extends DBRepositoryUnid<any>, TEntityUnid extends DBBaseEntityUnid>(this: {
        new (target: EntityTarget<TEntityUnid>): S;
        REGISTER_NAME: string;
    }, target: EntityTarget<TEntityUnid>): S;
    protected constructor(target: EntityTarget<T>);
    countAll(): Promise<number>;
    findAll(): Promise<T[]>;
    findOne(unid: string): Promise<T | null>;
    createEntity(entityLike: DeepPartial<T>): Promise<T>;
    remove(unid: string): Promise<DeleteResult>;
    save(entity: T): Promise<T>;
    getRepository(): Repository<T>;
    getTableName(): string;
}
