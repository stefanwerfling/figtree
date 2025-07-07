export class RouteError extends Error {
    _status;
    _msg;
    _returnAsJson;
    constructor(status, msg, returnAsJson = true) {
        super(`[${status}] ${msg}`);
        this._status = status;
        this._msg = msg;
        this._returnAsJson = returnAsJson;
    }
    asJson() {
        return this._returnAsJson;
    }
    defaultReturn() {
        return {
            statusCode: this._status,
            msg: this._msg
        };
    }
    getStatus() {
        return this._status;
    }
    getRawMsg() {
        return this._msg;
    }
}
//# sourceMappingURL=RouteError.js.map