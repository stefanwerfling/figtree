import { DBRepositoryUnid } from '../../DBRepositoryUnid.js';
import { DbSetupState } from '../Entities/DbSetupState.js';
export class DbSetupStateRepository extends DBRepositoryUnid {
    static REGISTER_NAME = 'db_setup_state';
    static getInstance() {
        return super.getSingleInstance(DbSetupState);
    }
    async isApplied(hookId) {
        const existing = await this._repository.findOne({
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
        const rows = await this._repository.find();
        return rows.map(r => r.unid);
    }
    async removeApplied(hookId) {
        await this._repository.delete({ unid: hookId });
    }
}
//# sourceMappingURL=DbSetupStateRepository.js.map