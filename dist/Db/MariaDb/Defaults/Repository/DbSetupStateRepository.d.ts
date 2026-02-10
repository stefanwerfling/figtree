import { DBRepositoryUnid } from '../../DBRepositoryUnid.js';
import { DbSetupState } from '../Entities/DbSetupState.js';
export declare class DbSetupStateRepository extends DBRepositoryUnid<DbSetupState> {
    static REGISTER_NAME: string;
    static getInstance(): DbSetupStateRepository;
    isApplied(hookId: string): Promise<boolean>;
    markApplied(hookId: string): Promise<void>;
    getAllApplied(): Promise<string[]>;
    removeApplied(hookId: string): Promise<void>;
}
