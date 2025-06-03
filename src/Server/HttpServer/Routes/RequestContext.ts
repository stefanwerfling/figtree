import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request context data
 */
export type RequestContextData = Map<string, any>;

/**
 * Request Context
 */
export class RequestContext {

    public static SESSIONID = 'sessionid';
    public static USERID = 'userid';
    public static ISLOGIN = 'islogin';

    /**
     * Single instance from request context
     * @private
     */
    private static _instance: RequestContext|null = null;

    /**
     * Return an instance
     * @return {RequestContext}
     */
    public static getInstance(): RequestContext {
        if (!RequestContext._instance) {
            RequestContext._instance = new RequestContext();
        }
        return RequestContext._instance;
    }

    /**
     * Has an instance
     * @return {boolean}
     */
    public static hasInstance(): boolean {
        return RequestContext._instance !== null;
    }

    /**
     * Async local storage
     * @private
     */
    private _asyncLocalStorage: AsyncLocalStorage<RequestContextData>;

    /**
     * Constructor
     * @private
     */
    private constructor() {
        this._asyncLocalStorage = new AsyncLocalStorage<RequestContextData>();
    }

    /**
     * Run with context
     * @param {RequestContextData} data
     * @param {() => void} callback
     */
    public runWithContext(data: RequestContextData, callback: () => void): void {
        this._asyncLocalStorage.run(data, callback);
    }

    /**
     * Enter with
     * @param {RequestContextData} data
     */
    public enterWith(data: RequestContextData): void {
        this._asyncLocalStorage.enterWith(data);
    }

    /**
     * Return value by store
     * @param {string} key
     * @template T
     * @return {T}
     */
    public get<T>(key: string): T | undefined {
        const store = this._asyncLocalStorage.getStore();
        return store?.get(key);
    }

    /**
     * Set a value by name in the store
     * @param {string} key
     * @template T
     * @param {T} value
     */
    public set<T>(key: string, value: T): void {
        const store = this._asyncLocalStorage.getStore();
        if (store) {
            store.set(key, value);
        }
    }

}