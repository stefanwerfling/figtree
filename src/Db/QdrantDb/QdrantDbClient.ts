import {QdrantClient} from '@qdrant/js-client-rest';
import {QdrantDbCollection} from './QdrantDbCollection.js';
import {QdrantDbCollectionLoader} from './QdrantDbCollectionLoader.js';

/**
 * Qdrant Client options
 */
export type QdrantDbClientOptions = {
    url: string;
    apiKey?: string;
};

/**
 * Qdrant Client — thin singleton wrapper around the official
 * `@qdrant/js-client-rest` client, mirroring {@link ChromaDbClient}.
 */
export class QdrantDbClient {

    /**
     * instance
     * @protected
     */
    protected static _instance: QdrantDbClient | null = null;

    /**
     * Return a qdrant client instance (creating it on first call with options).
     * @param {QdrantDbClientOptions} [options]
     * @return {QdrantDbClient}
     */
    public static getInstance(options?: QdrantDbClientOptions): QdrantDbClient {
        if (QdrantDbClient._instance === null) {
            if (options) {
                QdrantDbClient._instance = new QdrantDbClient(options);
            } else {
                throw new Error('QdrantDbClient::getInstance: Option not set for qdrant client init!');
            }
        }

        return QdrantDbClient._instance;
    }

    /**
     * Return whether an instance exists.
     * @return {boolean}
     */
    public static hasInstance(): boolean {
        return QdrantDbClient._instance !== null;
    }

    /**
     * client
     * @protected
     */
    protected _client: QdrantClient;

    /**
     * constructor
     * @param {QdrantDbClientOptions} options
     */
    public constructor(options: QdrantDbClientOptions) {
        this._client = new QdrantClient({
            url: options.url,
            apiKey: options.apiKey
        });
    }

    /**
     * Return the underlying qdrant client.
     * @return {QdrantClient}
     */
    public getClient(): QdrantClient {
        return this._client;
    }

    /**
     * load collections
     * @template T
     * @param {QdrantDbCollectionLoader} loader
     * @return {Promise<T[]>}
     */
    public loadCollections<T extends QdrantDbCollection>(loader: QdrantDbCollectionLoader<T>): Promise<T[]> {
        return loader.load(this);
    }

}