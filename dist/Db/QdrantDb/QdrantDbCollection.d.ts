import { QdrantDbClient } from './QdrantDbClient.js';
export type QdrantDistance = 'Cosine' | 'Dot' | 'Euclid' | 'Manhattan';
export type QdrantDbCollectionOptions = {
    vectorSize: number;
    distance?: QdrantDistance;
};
export type QdrantPoint = {
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
};
export type QdrantHit = {
    id: string | number;
    score: number;
    payload: Record<string, unknown> | null;
};
export declare abstract class QdrantDbCollection {
    protected _name: string;
    protected _client: QdrantDbClient;
    protected _vectorSize: number;
    protected _distance: QdrantDistance;
    protected constructor(name: string, options: QdrantDbCollectionOptions, client?: QdrantDbClient);
    init(): Promise<void>;
    upsert(points: QdrantPoint[]): Promise<void>;
    search(vector: number[], limit: number, filter?: Record<string, unknown>): Promise<QdrantHit[]>;
    deleteByFilter(filter: Record<string, unknown>): Promise<void>;
    count(filter?: Record<string, unknown>): Promise<number>;
    getName(): string;
}
