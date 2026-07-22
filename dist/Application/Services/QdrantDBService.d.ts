import { ServiceImportance } from 'figtree-schemas';
import { QdrantDbClient } from '../../Db/QdrantDb/QdrantDbClient.js';
import { ServiceAbstract } from '../../Service/ServiceAbstract.js';
export declare class QdrantDBService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    protected _qdrantDbClient: QdrantDbClient | null;
    constructor(serviceName?: string, serviceDependencies?: string[]);
    start(): Promise<void>;
    getClient(): QdrantDbClient | null;
    stop(): Promise<void>;
}
