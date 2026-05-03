/**
 * Abstract shared store
 */
export abstract class SharedStore {

    /**
     * Init the shared store
     */
    public abstract init(): Promise<void>;

    /**
     * Get value by key
     * @param {string} key
     * @return {T}
     * @template T
     */
    public abstract get<T = any>(key: string): Promise<T | undefined>;

    /**
     * Set a value by key
     * @param {string} key
     * @param {T} value
     * @template T
     */
    public abstract set<T = any>(key: string, value: T): Promise<void>;

    /**
     * delete value by key
     * @param {string} key
     */
    public abstract delete(key: string): Promise<void>;

    /**
     * has a key in the store
     * @param {string} key
     * @return {boolean}
     */
    public abstract has(key: string): Promise<boolean>;

    /**
     * Clear the shared store
     */
    public abstract clear(): Promise<void>;

}