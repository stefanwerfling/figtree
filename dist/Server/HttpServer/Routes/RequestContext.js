import { AsyncLocalStorage } from 'async_hooks';
export class RequestContext {
    static SESSIONID = 'sessionid';
    static USERID = 'userid';
    static ISLOGIN = 'islogin';
    static _instance;
    static getInstance() {
        if (!RequestContext._instance) {
            RequestContext._instance = new RequestContext();
        }
        return RequestContext._instance;
    }
    _asyncLocalStorage;
    constructor() {
        this._asyncLocalStorage = new AsyncLocalStorage();
    }
    runWithContext(data, callback) {
        this._asyncLocalStorage.run(data, callback);
    }
    enterWith(data) {
        this._asyncLocalStorage.enterWith(data);
    }
    get(key) {
        const store = this._asyncLocalStorage.getStore();
        return store?.get(key);
    }
    set(key, value) {
        const store = this._asyncLocalStorage.getStore();
        if (store) {
            store.set(key, value);
        }
    }
}
//# sourceMappingURL=RequestContext.js.map