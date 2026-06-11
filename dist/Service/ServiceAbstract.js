import { format } from 'util';
import { ServiceImportance, ServiceLogLevel, ServiceStatus, ServiceType } from 'figtree-schemas';
import { Logger } from '../Logger/Logger.js';
import { ServiceLogBuffer } from './ServiceLogBuffer.js';
export class ServiceAbstract {
    _type;
    _importance = ServiceImportance.Optional;
    _status = ServiceStatus.None;
    _statusMsg = '';
    _inProcess = false;
    _serviceName = '';
    _serviceDependencies = [];
    _startedAt = null;
    _restartCount = 0;
    _logBuffer = new ServiceLogBuffer();
    _logger = null;
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
    getStartedAt() {
        return this._startedAt;
    }
    getRestartCount() {
        return this._restartCount;
    }
    markStarted() {
        if (this._startedAt !== null) {
            this._restartCount += 1;
        }
        this._startedAt = new Date();
    }
    getLogger() {
        if (this._logger !== null) {
            return this._logger;
        }
        const buf = this._logBuffer;
        const winston = () => Logger.getLogger();
        this._logger = {
            info: (msg, ...meta) => {
                buf.push(ServiceLogLevel.info, format(msg, ...meta));
                winston().info(msg, ...meta);
            },
            warn: (msg, ...meta) => {
                buf.push(ServiceLogLevel.warn, format(msg, ...meta));
                winston().warn(msg, ...meta);
            },
            error: (msg, ...meta) => {
                buf.push(ServiceLogLevel.error, format(msg, ...meta));
                winston().error(msg, ...meta);
            },
            debug: (msg, ...meta) => {
                buf.push(ServiceLogLevel.debug, format(msg, ...meta));
                winston().debug(msg, ...meta);
            },
        };
        return this._logger;
    }
    enableServiceLogging(maxLines) {
        this._logBuffer.enable(maxLines);
    }
    disableServiceLogging() {
        this._logBuffer.disable();
    }
    getServiceLog() {
        return {
            active: this._logBuffer.isActive(),
            maxLines: this._logBuffer.getMaxLines(),
            lines: this._logBuffer.getLines(),
        };
    }
    async healthCheck() {
        return this._status === ServiceStatus.Success;
    }
    markUnhealthy(reason) {
        this._status = ServiceStatus.Error;
        this._statusMsg = reason;
    }
    async start() {
    }
    async invoke() {
    }
    async stop(_forced = false) {
    }
    async reload() {
    }
}
//# sourceMappingURL=ServiceAbstract.js.map