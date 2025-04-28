export var ServiceType;
(function (ServiceType) {
    ServiceType[ServiceType["runner"] = 0] = "runner";
    ServiceType[ServiceType["scheduler"] = 1] = "scheduler";
})(ServiceType || (ServiceType = {}));
export var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["None"] = "none";
    ServiceStatus["Progress"] = "progress";
    ServiceStatus["Success"] = "success";
    ServiceStatus["Error"] = "error";
})(ServiceStatus || (ServiceStatus = {}));
export class ServiceAbstract {
    _type;
    _status = ServiceStatus.None;
    _statusMsg = '';
    _inProcess = false;
    constructor() {
        this._type = ServiceType.runner;
    }
    getType() {
        return this._type;
    }
    isProcess() {
        return this._inProcess;
    }
    getStatus() {
        return this._status;
    }
    getStatusMsg() {
        return this._statusMsg;
    }
    async start() { }
    async invoke() { }
    async stop(forced = false) { }
    async reload() { }
}
//# sourceMappingURL=ServiceAbstract.js.map