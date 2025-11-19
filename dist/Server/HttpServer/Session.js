export class Session {
    static isUserLogin(session) {
        if (session.user) {
            return session.user.isLogin;
        }
        return false;
    }
    static defaultInitSession() {
        return {
            isLogin: false,
            userid: '',
            role: ''
        };
    }
}
//# sourceMappingURL=Session.js.map