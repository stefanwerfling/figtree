import { ChromaClient } from "chromadb";
import { ChromaDbCollection } from './ChromaDbCollection.js';
import { ChromaDbCollectionLoader } from './ChromaDbCollectionLoader.js';
export type ChromaDbClientOptions = {
    path: string;
};
export declare class ChromaDbClient {
    protected static _instance: ChromaDbClient;
    static getInstance(options?: ChromaDbClientOptions): ChromaDbClient;
    static hasInstance(): boolean;
    protected _client: ChromaClient;
    constructor(options: ChromaDbClientOptions);
    getClient(): ChromaClient;
    loadCollections<T extends ChromaDbCollection>(loader: ChromaDbCollectionLoader<T>): Promise<T[]>;
}
