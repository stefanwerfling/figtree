import { QdrantDbClient } from './QdrantDbClient.js';
export class QdrantDbCollection {
    _name;
    _client;
    _vectorSize;
    _distance;
    constructor(name, options, client) {
        let tclient = null;
        if (client) {
            tclient = client;
        }
        else if (QdrantDbClient.hasInstance()) {
            tclient = QdrantDbClient.getInstance();
        }
        if (tclient === null) {
            throw new Error('Please get a client instance from QdrantDbClient');
        }
        this._name = name;
        this._client = tclient;
        this._vectorSize = options.vectorSize;
        this._distance = options.distance ?? 'Cosine';
    }
    async init() {
        const client = this._client.getClient();
        const existing = await client.collectionExists(this._name);
        if (existing.exists) {
            return;
        }
        await client.createCollection(this._name, {
            vectors: {
                size: this._vectorSize,
                distance: this._distance
            }
        });
    }
    async upsert(points) {
        if (points.length === 0) {
            return;
        }
        await this._client.getClient().upsert(this._name, {
            wait: true,
            points: points.map(point => ({
                id: point.id,
                vector: point.vector,
                payload: point.payload ?? {}
            }))
        });
    }
    async search(vector, limit, filter) {
        const result = await this._client.getClient().search(this._name, {
            vector: vector,
            limit: limit,
            filter: filter,
            with_payload: true
        });
        return result.map(hit => ({
            id: hit.id,
            score: hit.score,
            payload: hit.payload ?? null
        }));
    }
    async deleteByFilter(filter) {
        await this._client.getClient().delete(this._name, {
            wait: true,
            filter: filter
        });
    }
    async count(filter) {
        const result = await this._client.getClient().count(this._name, {
            filter: filter,
            exact: true
        });
        return result.count;
    }
    getName() {
        return this._name;
    }
}
//# sourceMappingURL=QdrantDbCollection.js.map