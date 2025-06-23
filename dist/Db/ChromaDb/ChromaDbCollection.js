import { ChromaDbClient } from './ChromaDbClient.js';
export class ChromaDbCollection {
    _name;
    _collection;
    constructor(name, metadata, client) {
        const tclient = client ? client : (ChromaDbClient.hasInstance() ? ChromaDbClient.getInstance() : null);
        if (tclient === null) {
            throw new Error('Please get a client instance from ChromaDbClient');
        }
        this._name = name;
        this._init(name, metadata, tclient).then();
    }
    async _init(name, metadata, client) {
        this._collection = await client.getClient().getOrCreateCollection({
            name: name,
            metadata: metadata
        });
    }
}
//# sourceMappingURL=ChromaDbCollection.js.map