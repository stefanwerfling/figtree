import { ChromaDbClient } from './ChromaDbClient.js';
import { ChromaDbCollection } from './ChromaDbCollection.js';
export declare abstract class ChromaDbCollectionLoader<T extends ChromaDbCollection> {
    abstract load(client: ChromaDbClient): Promise<T[]>;
}
