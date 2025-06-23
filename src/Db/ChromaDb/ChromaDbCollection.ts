import {Collection} from 'chromadb';
import {ChromaDbClient} from './ChromaDbClient.js';

/**
 * Chroma Collection
 */
export abstract class ChromaDbCollection {

    /**
     * Name of collection
     * @protected
     */
    protected _name: string;

    /**
     * Collection
     * @protected
     */
    protected _collection?: Collection;

    /**
     * Constructor
     * @param {string} name
     * @param {Record<string, any>} metadata
     * @param {ChromaDbClient} client
     * @protected
     */
    protected constructor(name: string, metadata: Record<string, any>, client?: ChromaDbClient) {
        const tclient = client ? client : (ChromaDbClient.hasInstance() ? ChromaDbClient.getInstance() : null);

        if (tclient === null) {
            throw new Error('Please get a client instance from ChromaDbClient');
        }

        this._name = name;
        this._init(name, metadata, tclient).then();
    }

    /**
     * init
     * @param name
     * @param metadata
     * @param client
     * @protected
     */
    protected async _init(name: string, metadata: Record<string, any>, client: ChromaDbClient): Promise<void> {
        this._collection = await client.getClient().getOrCreateCollection({
            name: name,
            metadata: metadata
        });
    }


}