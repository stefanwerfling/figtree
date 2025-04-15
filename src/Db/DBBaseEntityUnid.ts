import {PrimaryGeneratedColumn} from 'typeorm';
import {VersionedBaseEntity} from 'typeorm-versions';

/**
 * Database base entity unid
 */
export class DBBaseEntityUnid extends VersionedBaseEntity {

    /**
     * id
     */
    @PrimaryGeneratedColumn('uuid')
    public unid!: string;

}