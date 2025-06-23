import { ChromaClient } from "chromadb";
export class ChromaDbClient {
    static _instance;
    static getInstance(options) {
        if (ChromaDbClient._instance === null) {
            if (options) {
                ChromaDbClient._instance = new ChromaDbClient(options);
            }
            else {
                throw new Error('ChromaClient::getInstance: Option not set for chromadb client init!');
            }
        }
        return ChromaDbClient._instance;
    }
    static hasInstance() {
        return ChromaDbClient._instance !== null;
    }
    _client;
    constructor(options) {
        this._client = new ChromaClient({
            path: options.path
        });
    }
    getClient() {
        return this._client;
    }
    loadCollections(loader) {
        return loader.load(this);
    }
}
//# sourceMappingURL=ChromaDbClient.js.map