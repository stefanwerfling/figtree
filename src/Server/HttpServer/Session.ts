import {SessionData, SessionUserData} from 'figtree_schemas';

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
        if (session.user) {
            return session.user.isLogin;
        }

        return false;
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