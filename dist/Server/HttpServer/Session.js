export class Session {
    static isUserLogin(session) {
        return session.user?.isLogin;
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