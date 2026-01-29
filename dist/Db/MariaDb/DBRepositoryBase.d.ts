import { BaseEntity, EntityTarget, Repository } from 'typeorm';
export declare abstract class DBRepositoryBase<T extends BaseEntity> {
    protected static _instance: Map<string, DBRepositoryBase<any>>;
    protected readonly _repository: Repository<T>;
    protected static getSingleInstance<S extends DBRepositoryBase<any>, TEntity extends BaseEntity>(this: {
        new (target: EntityTarget<TEntity>): S;
        REGISTER_NAME: string;
    }, target: EntityTarget<TEntity>): S;
    protected constructor(target: EntityTarget<T>);
    countAll(): Promise<number>;
    findAll(): Promise<T[]>;
    getRepository(): Repository<T>;
    getTableName(): string;
}
