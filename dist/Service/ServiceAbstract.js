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
export var ServiceImportance;
(function (ServiceImportance) {
    ServiceImportance[ServiceImportance["Optional"] = 0] = "Optional";
    ServiceImportance[ServiceImportance["Important"] = 1] = "Important";
    ServiceImportance[ServiceImportance["Critical"] = 2] = "Critical";
})(ServiceImportance || (ServiceImportance = {}));
export class ServiceAbstract {
    _type;
    _importance = ServiceImportance.Optional;
    _status = ServiceStatus.None;
    _statusMsg = '';
    _inProcess = false;
    _serviceName = '';
    _serviceDependencies = [];
    constructor(serviceName, serviceDependencies) {
        this._type = ServiceType.runner;
        if (serviceName) {
            this.setServiceName(serviceName);
        }
        else {
            this.setServiceName(this.constructor.name);
        }
        if (serviceDependencies) {
            this.setServiceDependencies(serviceDependencies);
        }
    }
    getServiceName() {
        return this._serviceName;
    }
    setServiceName(name) {
        this._serviceName = name;
    }
    getServiceDependencies() {
        return this._serviceDependencies;
    }
    setServiceDependencies(dependencies) {
        this._serviceDependencies = dependencies;
    }
    getType() {
        return this._type;
    }
    getImportance() {
        return this._importance;
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