import {PrimaryGeneratedColumn, BaseEntity} from 'typeorm';

/**
 * Database base entriy with id
 */
export class DBBaseEntityId extends BaseEntity {

    /**
     * id
     */
    @PrimaryGeneratedColumn()
    public id!: number;

}