import { QdrantDbClient } from './QdrantDbClient.js';
import { QdrantDbCollection } from './QdrantDbCollection.js';
export declare abstract class QdrantDbCollectionLoader<T extends QdrantDbCollection> {
    abstract load(client: QdrantDbClient): Promise<T[]>;
}
