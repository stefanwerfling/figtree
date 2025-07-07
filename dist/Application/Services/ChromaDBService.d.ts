import { ChromaDbClient } from '../../Db/ChromaDb/ChromaDbClient.js';
import { ServiceAbstract, ServiceImportance } from '../../Service/ServiceAbstract.js';
export declare class ChromaDBService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    protected _chromaDbClient: ChromaDbClient | null;
    constructor(serviceName?: string, serviceDependencies?: string[]);
    start(): Promise<void>;
    getClient(): ChromaDbClient | null;
    stop(forced?: boolean): Promise<void>;
}
