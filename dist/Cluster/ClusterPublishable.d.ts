export interface ClusterPublishable {
    getNamespace(): string;
    serialize(): unknown | Promise<unknown>;
}
