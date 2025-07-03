import { EntityTarget } from 'typeorm';
import { DBBaseEntityId } from './DBBaseEntityId.js';
import { DBRepository } from './DBRepository.js';
export type DBRepositoryType<E extends DBBaseEntityId> = {
    new (target: EntityTarget<E>): DBRepository<E>;
    getInstance(): DBRepository<E>;
};
