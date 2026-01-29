import {SessionData, SessionUserData} from 'figtree-schemas';

/**
 * Session
 */
export class Session {

    /**
     * Is the User login by session data check
     * @param {SessionData} session
     * @return {boolean}
     */
    public static isUserLogin(session: SessionData): boolean {
        return session.user?.isLogin === true;
    }

    /**
     * Default init session
     * @return {T}
     * @template T
     */
    public static defaultInitSession<T=SessionUserData>(): T {
        return {
            isLogin: false,
            userid: '',
            role: ''
        } as T;
    }

}