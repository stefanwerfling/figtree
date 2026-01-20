import { SessionData, SessionUserData } from 'figtree-schemas';
export declare class Session {
    static isUserLogin(session: SessionData): boolean;
    static defaultInitSession<T = SessionUserData>(): T;
}
