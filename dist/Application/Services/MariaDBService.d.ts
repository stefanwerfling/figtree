import { DBLoaderType } from './MariaDBService/DBLoader.js';
import { ServiceAbstract, ServiceImportance } from '../../Service/ServiceAbstract.js';
import { DBSetupHook } from './MariaDBService/DBSetupHook.js';
export type MariaDBServiceOptions = {
    migrationsRun?: boolean;
    synchronize?: boolean;
};
export declare class MariaDBService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    protected _loader: DBLoaderType;
    protected _setupHooks: DBSetupHook[];
    protected _options: MariaDBServiceOptions;
    constructor(loader: DBLoaderType, serviceName?: string, serviceDependencies?: string[], options?: MariaDBServiceOptions, setupHooks?: DBSetupHook[]);
    registerSetupHook(hook: DBSetupHook): void;
    protected _runSetupHooks(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
