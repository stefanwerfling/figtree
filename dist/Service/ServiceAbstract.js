import { ServiceImportance, ServiceStatus, ServiceType } from 'figtree-schemas';
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