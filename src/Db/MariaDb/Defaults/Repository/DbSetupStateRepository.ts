import {DBRepositoryUnid} from '../../DBRepositoryUnid.js';
import {DbSetupState} from '../Entities/DbSetupState.js';

/**
 * Db setup state repository
 */
export class DbSetupStateRepository extends DBRepositoryUnid<DbSetupState> {

    /**
     * register name
     */
    public static REGISTER_NAME = 'db_setup_state';

    /**
     * Return the instance
     * @return {DbSetupStateRepository}
     */
    public static getInstance(): DbSetupStateRepository {
        return super.getSingleInstance(DbSetupState);
    }

    /**
     * is applied
     * @param {string} hookId
     */
    public async isApplied(hookId: string): Promise<boolean> {
        const repository = await this._repository;
        const existing = await repository.findOne({
            where: {
                unid: hookId
            }
        });

        return existing !== null;
    }

    /**
     * mark applied
     * @param {string} hookId
     */
    public async markApplied(hookId: string): Promise<void> {
        const entity = new DbSetupState();
        entity.unid = hookId;
        await this.save(entity);
    }

    /**
     * Return all applied
     * @return {string[]}
     */
    public async getAllApplied(): Promise<string[]> {
        const repository = await this._repository;
        const rows = await repository.find();
        return rows.map(r => r.unid);
    }

    /**
     * Remove applied
     * @param {string} hookId
     */
    public async removeApplied(hookId: string): Promise<void> {
        const repository = await this._repository;
        await repository.delete({ unid: hookId });
    }

}