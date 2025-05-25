import { DBLoaderType } from '../../Db/MariaDb/DBLoader.js';
import { ServiceAbstract, ServiceImportance } from '../../Service/ServiceAbstract.js';
export declare class MariaDBService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    protected _loader: DBLoaderType;
    constructor(loader: DBLoaderType, serviceName?: string, serviceDependencies?: string[]);
    start(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
}
