import {QdrantDbClient} from './QdrantDbClient.js';

/**
 * Distance metric for a Qdrant collection's vectors.
 */
export type QdrantDistance = 'Cosine' | 'Dot' | 'Euclid' | 'Manhattan';

/**
 * Options for a Qdrant collection: the vector dimensionality and distance.
 */
export type QdrantDbCollectionOptions = {
    vectorSize: number;
    distance?: QdrantDistance;
};

/**
 * A point to upsert: a stable id, its vector and an optional payload (the
 * per-point metadata that filters and citations key on).
 */
export type QdrantPoint = {
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
};

/**
 * A single search hit.
 */
export type QdrantHit = {
    id: string | number;
    score: number;
    payload: Record<string, unknown> | null;
};

/**
 * Qdrant Collection — abstract base mirroring {@link ChromaDbCollection}, but
 * with an explicit, awaitable {@link init} (no fire-and-forget in the
 * constructor) and generic vector primitives (upsert/search/delete/count) so
 * concrete collections only map their domain types.
 *
 * Isolation stays a payload filter (not a collection-per-tenant): `search`
 * takes a Qdrant filter so callers can restrict results (e.g. by an allowed
 * set of source ids).
 */
export abstract class QdrantDbCollection {

    /**
     * Name of collection.
     * @protected
     */
    protected _name: string;

    /**
     * Client used for all operations.
     * @protected
     */
    protected _client: QdrantDbClient;

    /**
     * Vector dimensionality the collection is created with.
     * @protected
     */
    protected _vectorSize: number;

    /**
     * Distance metric.
     * @protected
     */
    protected _distance: QdrantDistance;

    /**
     * Constructor.
     * @param {string} name
     * @param {QdrantDbCollectionOptions} options
     * @param {QdrantDbClient} [client] - defaults to the QdrantDbClient singleton
     * @protected
     */
    protected constructor(name: string, options: QdrantDbCollectionOptions, client?: QdrantDbClient) {
        let tclient: QdrantDbClient | null = null;

        if (client) {
            tclient = client;
        } else if (QdrantDbClient.hasInstance()) {
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

    /**
     * Create the collection if it does not exist yet. Must be awaited before
     * any other call.
     * @returns {Promise<void>}
     */
    public async init(): Promise<void> {
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

    /**
     * Upsert points (idempotent on id). Waits for the write to be applied.
     * @param {QdrantPoint[]} points
     * @returns {Promise<void>}
     */
    public async upsert(points: QdrantPoint[]): Promise<void> {
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

    /**
     * Nearest-neighbour search, optionally restricted by a Qdrant filter.
     * @param {number[]} vector
     * @param {number} limit
     * @param {Record<string, unknown>} [filter] - Qdrant filter object
     * @returns {Promise<QdrantHit[]>}
     */
    public async search(vector: number[], limit: number, filter?: Record<string, unknown>): Promise<QdrantHit[]> {
        const result = await this._client.getClient().search(this._name, {
            vector: vector,
            limit: limit,
            filter: filter,
            with_payload: true
        });

        return result.map(hit => ({
            id: hit.id,
            score: hit.score,
            payload: (hit.payload as Record<string, unknown> | null) ?? null
        }));
    }

    /**
     * Delete points matching a Qdrant filter.
     * @param {Record<string, unknown>} filter
     * @returns {Promise<void>}
     */
    public async deleteByFilter(filter: Record<string, unknown>): Promise<void> {
        await this._client.getClient().delete(this._name, {
            wait: true,
            filter: filter
        });
    }

    /**
     * Count points, optionally matching a filter.
     * @param {Record<string, unknown>} [filter]
     * @returns {Promise<number>}
     */
    public async count(filter?: Record<string, unknown>): Promise<number> {
        const result = await this._client.getClient().count(this._name, {
            filter: filter,
            exact: true
        });

        return result.count;
    }

    /**
     * Collection name.
     * @returns {string}
     */
    public getName(): string {
        return this._name;
    }

}