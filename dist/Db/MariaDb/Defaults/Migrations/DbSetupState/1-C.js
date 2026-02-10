import { Table } from 'typeorm';
export class CreateTableDbSetupState0000000000001 {
    name = 'CreateTableDbSetupState0000000000001';
    async up(queryRunner) {
        await queryRunner.createTable(new Table({
            name: 'db_setup_state',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
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
        }), true);
    }
    async down(queryRunner) {
        await queryRunner.dropTable('db_setup_state', true);
    }
}
//# sourceMappingURL=1-C.js.map