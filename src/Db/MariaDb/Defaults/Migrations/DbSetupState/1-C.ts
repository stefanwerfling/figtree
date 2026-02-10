import {MigrationInterface, QueryRunner, Table} from 'typeorm';

/**
 * Create table db setup state
 */
export class CreateTableDbSetupState0000000000001 implements MigrationInterface {

    /**
     * Name
     */
    public name = 'CreateTableDbSetupState0000000000001';

    /**
     * up
     * @param {QueryRunner} queryRunner
     */
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'db_setup_state',
                columns: [
                    {
                        name: 'unid',
                        type: 'varchar',
                        length: '36',   // UUID
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: 'appliedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true // ifNotExist
        );
    }

    /**
     * down
     * @param {QueryRunner} queryRunner
     */
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('db_setup_state', true);
    }
}