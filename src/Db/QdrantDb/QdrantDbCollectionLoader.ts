import {QdrantDbClient} from './QdrantDbClient.js';
import {QdrantDbCollection} from './QdrantDbCollection.js';

/**
 * collection loader
 * @template T
 */
export abstract class QdrantDbCollectionLoader<T extends QdrantDbCollection> {

    /**
     * load
     * @param {QdrantDbClient} client
     * @return {Promise<T[]>}
     */
    public abstract load(client: QdrantDbClient): Promise<T[]>;

}