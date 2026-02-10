import {Column, Entity} from 'typeorm';
import {DBBaseEntityUnid} from '../../DBBaseEntityUnid.js';

@Entity({ name: 'db_setup_state' })
export class DbSetupState extends DBBaseEntityUnid {

    /**
     * When the setup hook was applied
     */
    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    public appliedAt!: Date;

}