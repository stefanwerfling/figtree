import {EntityTarget} from 'typeorm';
import {DBBaseEntityId} from './DBBaseEntityId.js';
import {DBService} from './DBService.js';

/**
 * DBServiceType
 */
export type DBServiceType<E extends DBBaseEntityId> = {
    new(target: EntityTarget<E>): DBService<E>;
    getInstance(): DBService<E>;
};