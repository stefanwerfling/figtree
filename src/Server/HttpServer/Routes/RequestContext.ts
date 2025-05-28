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
    private static _instance: RequestContext;

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

    public runWithContext(data: RequestContextData, callback: () => void): void {
        this._asyncLocalStorage.run(data, callback);
    }

    public enterWith(data: RequestContextData): void {
        this._asyncLocalStorage.enterWith(data);
    }

    public get<T>(key: string): T | undefined {
        const store = this._asyncLocalStorage.getStore();
        return store?.get(key);
    }

    public set<T>(key: string, value: T): void {
        const store = this._asyncLocalStorage.getStore();
        if (store) {
            store.set(key, value);
        }
    }

}