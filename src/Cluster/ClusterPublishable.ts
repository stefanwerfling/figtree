/**
 * Implement on any class whose state should be visible cluster-wide.
 *
 * The class is registered with `ClusterRegistry` and its `serialize()` is
 * called on every heartbeat tick. The result (must be JSON-serializable) is
 * written to the underlying `SharedStore` under the key
 * `cluster:<namespace>:<workerId>` and queryable via `queryAll(namespace)`.
 *
 * Two parallel publishables on the same worker MUST use distinct namespaces.
 */
export interface ClusterPublishable {

    /**
     * Stable namespace identifying this publishable's data.
     * Examples: `'service-manager'`, `'job-queue'`, `'connection-pool'`.
     */
    getNamespace(): string;

    /**
     * Snapshot the current state. Must return a JSON-serializable value.
     * May be sync or async — async lets you gather data from awaitables.
     */
    serialize(): unknown | Promise<unknown>;

}