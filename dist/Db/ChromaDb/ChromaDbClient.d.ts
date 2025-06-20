import { ChromaClient } from "chromadb";
export type ChromaDbClientOptions = {
    path: string;
};
export declare class ChromaDbClient {
    protected static _instance: ChromaDbClient;
    static getInstance(options?: ChromaDbClientOptions): ChromaDbClient;
    static hasInstance(): boolean;
    protected _client: ChromaClient;
    constructor(options: ChromaDbClientOptions);
    getClient(): ChromaClient;
}
