import {SessionData} from '../../Schemas/Server/RequestData.js';

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

}