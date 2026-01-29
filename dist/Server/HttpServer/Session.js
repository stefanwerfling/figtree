export class Session {
    static isUserLogin(session) {
        return session.user?.isLogin === true;
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