import {PrimaryGeneratedColumn} from 'typeorm';
import {VersionedBaseEntity} from 'typeorm-versions';

/**
 * Database base entriy with id
 */
export class DBBaseEntityId extends VersionedBaseEntity {

    /**
     * id
     */
    @PrimaryGeneratedColumn()
    public id!: number;

}