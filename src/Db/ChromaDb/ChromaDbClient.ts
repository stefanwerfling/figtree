import { ChromaClient } from "chromadb";

/**
 * ChromaDB Client options
 */
export type ChromaDbClientOptions = {
    path: string;
};

/**
 * ChromaDB Client
 */
export class ChromaDbClient {

    /**
     * instance
     * @protected
     */
    protected static _instance: ChromaDbClient;

    /**
     * Return a chromadb instance
     * @param options
     */
    public static getInstance(options?: ChromaDbClientOptions): ChromaDbClient {
        if (ChromaDbClient._instance === null) {
            if (options) {
                ChromaDbClient._instance = new ChromaDbClient(options);
            } else {
                throw new Error('ChromaClient::getInstance: Option not set for chromadb client init!');
            }
        }

        return ChromaDbClient._instance;
    }

    /**
     * Return has an instance
     */
    public static hasInstance(): boolean {
        return ChromaDbClient._instance !== null;
    }

    /**
     * client
     * @protected
     */
    protected _client: ChromaClient;

    /**
     * constructor
     * @param {ChromaDbClientOptions} options
     */
    public constructor(options: ChromaDbClientOptions) {
        this._client = new ChromaClient({
            path: options.path
        });
    }

    /**
     * Return the client
     * @return {ChromaClient}
     */
    public getClient(): ChromaClient {
        return this._client;
    }
}