import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantDbCollection } from './QdrantDbCollection.js';
import { QdrantDbCollectionLoader } from './QdrantDbCollectionLoader.js';
export type QdrantDbClientOptions = {
    url: string;
    apiKey?: string;
};
export declare class QdrantDbClient {
    protected static _instance: QdrantDbClient | null;
    static getInstance(options?: QdrantDbClientOptions): QdrantDbClient;
    static hasInstance(): boolean;
    protected _client: QdrantClient;
    constructor(options: QdrantDbClientOptions);
    getClient(): QdrantClient;
    loadCollections<T extends QdrantDbCollection>(loader: QdrantDbCollectionLoader<T>): Promise<T[]>;
}
