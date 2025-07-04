import { DeleteResult, EntityTarget, Repository } from 'typeorm';
import { DBBaseEntityId } from './DBBaseEntityId.js';
export declare abstract class DBRepository<T extends DBBaseEntityId> {
    protected static _instance: Map<string, DBRepository<any>>;
    protected readonly _repository: Repository<T>;
    protected static getSingleInstance<I extends DBBaseEntityId, S extends DBRepository<I>>(tclass: new (tentrie: EntityTarget<I>) => S, tentrie: EntityTarget<I>, registerName: string): S;
    protected constructor(target: EntityTarget<T>);
    countAll(): Promise<number>;
    findAll(): Promise<T[]>;
    findOne(id: number): Promise<T | null>;
    remove(id: number): Promise<DeleteResult>;
    save(entity: T): Promise<T>;
    getRepository(): Repository<T>;
    getTableName(): string;
}
