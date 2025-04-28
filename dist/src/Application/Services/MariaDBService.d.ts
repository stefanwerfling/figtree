import { DBLoaderType } from '../../Db/MariaDb/DBLoader.js';
import { ServiceAbstract } from '../../Service/ServiceAbstract.js';
export declare class MariaDBService extends ServiceAbstract {
    protected _loader: DBLoaderType;
    constructor(loader: DBLoaderType);
    start(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
}
