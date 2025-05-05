import { DeleteResult, EntityTarget, Repository } from 'typeorm';
import { DBBaseEntityId } from './DBBaseEntityId.js';
export declare abstract class DBService<T extends DBBaseEntityId> {
    protected static _instance: Map<string, DBService<any>>;
    protected readonly _repository: Repository<T>;
    protected static getSingleInstance<I extends DBBaseEntityId, S extends DBService<I>>(tclass: new (tentrie: EntityTarget<I>) => S, tentrie: EntityTarget<I>, registerName: string): S;
    constructor(target: EntityTarget<T>);
    countAll(): Promise<number>;
    findAll(): Promise<T[]>;
    findOne(id: number): Promise<T | null>;
    remove(id: number): Promise<DeleteResult>;
    save(entity: T): Promise<T>;
    getRepository(): Repository<T>;
    getTableName(): string;
}
