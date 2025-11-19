import { SessionData, SessionUserData } from '../../Schemas/Server/RequestData.js';
export declare class Session {
    static isUserLogin(session: SessionData): boolean;
    static defaultInitSession<T = SessionUserData>(): T;
}
