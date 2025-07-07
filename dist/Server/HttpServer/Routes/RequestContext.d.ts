export type RequestContextData = Map<string, any>;
export declare class RequestContext {
    static SESSIONID: string;
    static USERID: string;
    static ISLOGIN: string;
    private static _instance;
    static getInstance(): RequestContext;
    static hasInstance(): boolean;
    private _asyncLocalStorage;
    private constructor();
    runWithContext(data: RequestContextData, callback: () => void): void;
    enterWith(data: RequestContextData): void;
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
}
