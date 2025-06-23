import {ChromaDbClient} from './ChromaDbClient.js';
import {ChromaDbCollection} from './ChromaDbCollection.js';

/**
 * collection loader
 * @template T
 */
export abstract class ChromaDbCollectionLoader<T extends ChromaDbCollection>  {

    /**
     * load
     * @param {ChromaDbClient} client
     * @return {T[]}
     */
    public abstract load(client: ChromaDbClient): Promise<T[]>;

}