export class Session {
    static isUserLogin(session) {
        if (session.user) {
            return session.user.isLogin;
        }
        return false;
    }
}
//# sourceMappingURL=Session.js.map