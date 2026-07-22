import { QdrantClient } from '@qdrant/js-client-rest';
export class QdrantDbClient {
    static _instance = null;
    static getInstance(options) {
        if (QdrantDbClient._instance === null) {
            if (options) {
                QdrantDbClient._instance = new QdrantDbClient(options);
            }
            else {
                throw new Error('QdrantDbClient::getInstance: Option not set for qdrant client init!');
            }
        }
        return QdrantDbClient._instance;
    }
    static hasInstance() {
        return QdrantDbClient._instance !== null;
    }
    _client;
    constructor(options) {
        this._client = new QdrantClient({
            url: options.url,
            apiKey: options.apiKey
        });
    }
    getClient() {
        return this._client;
    }
    loadCollections(loader) {
        return loader.load(this);
    }
}
//# sourceMappingURL=QdrantDbClient.js.map