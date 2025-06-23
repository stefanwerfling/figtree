import { Collection } from 'chromadb';
import { ChromaDbClient } from './ChromaDbClient.js';
export declare abstract class ChromaDbCollection {
    protected _name: string;
    protected _collection?: Collection;
    protected constructor(name: string, metadata: Record<string, any>, client?: ChromaDbClient);
    protected _init(name: string, metadata: Record<string, any>, client: ChromaDbClient): Promise<void>;
}
