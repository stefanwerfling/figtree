import { DeepPartial, DeleteResult, EntityTarget, Repository } from 'typeorm';
import { DBBaseEntityId } from './DBBaseEntityId.js';
export declare abstract class DBRepository<T extends DBBaseEntityId> {
    protected static _instance: Map<string, DBRepository<any>>;
    protected readonly _repository: Repository<T>;
    protected static getSingleInstance<S extends DBRepository<any>, TEntity extends DBBaseEntityId>(this: {
        new (target: EntityTarget<TEntity>): S;
        REGISTER_NAME: string;
    }, target: EntityTarget<TEntity>): S;
    protected constructor(target: EntityTarget<T>);
    countAll(): Promise<number>;
    findAll(): Promise<T[]>;
    findOne(id: number): Promise<T | null>;
    createEntity(entityLike: DeepPartial<T>): Promise<T>;
    remove(id: number): Promise<DeleteResult>;
    save(entity: T): Promise<T>;
    getRepository(): Repository<T>;
    getTableName(): string;
}
