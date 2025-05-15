import {PrimaryGeneratedColumn, BaseEntity} from 'typeorm';

/**
 * Database base entity unid
 */
export class DBBaseEntityUnid extends BaseEntity {

    /**
     * id
     */
    @PrimaryGeneratedColumn('uuid')
    public unid!: string;

}