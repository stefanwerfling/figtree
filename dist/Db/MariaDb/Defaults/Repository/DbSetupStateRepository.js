import { DBRepositoryUnid } from '../../DBRepositoryUnid.js';
import { DbSetupState } from '../Entities/DbSetupState.js';
export class DbSetupStateRepository extends DBRepositoryUnid {
    static REGISTER_NAME = 'db_setup_state';
    static getInstance() {
        return super.getSingleInstance(DbSetupState);
    }
    async isApplied(hookId) {
        const repository = await this._repository;
        const existing = await repository.findOne({
            where: {
                unid: hookId
            }
        });
        return existing !== null;
    }
    async markApplied(hookId) {
        const entity = new DbSetupState();
        entity.unid = hookId;
        await this.save(entity);
    }
    async getAllApplied() {
        const repository = await this._repository;
        const rows = await repository.find();
        return rows.map(r => r.unid);
    }
    async removeApplied(hookId) {
        const repository = await this._repository;
        await repository.delete({ unid: hookId });
    }
}
//# sourceMappingURL=DbSetupStateRepository.js.map