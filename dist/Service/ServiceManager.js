import { ServiceImportance, ServiceStatus } from 'figtree-schemas';
import { Logger } from '../Logger/Logger.js';
import { DateHelper } from '../Utils/DateHelper.js';
import { ServiceJobAbstract } from './ServiceJobAbstract.js';
export const SERVICE_MANAGER_NAMESPACE = 'service-manager';
export const DEFAULT_START_ALL_TIMEOUT_MS = 30_000;
export const DEFAULT_MONITOR_INTERVAL_MS = 5_000;
export const DEFAULT_HEALTH_CHECK_INTERVAL_MS = 30_000;
export class ServiceManager {
    _services = [];
    _startAllTimeoutMs;
    _monitorIntervalMs;
    _healthCheckIntervalMs;
    _autoStartMonitor;
    _monitor = null;
    _inTick = false;
    _lastHealthCheckAt = new Map();
    constructor(options) {
        this._startAllTimeoutMs = options?.startAllTimeoutMs ?? DEFAULT_START_ALL_TIMEOUT_MS;
        this._monitorIntervalMs = options?.monitorIntervalMs ?? DEFAULT_MONITOR_INTERVAL_MS;
        this._healthCheckIntervalMs = options?.healthCheckIntervalMs ?? DEFAULT_HEALTH_CHECK_INTERVAL_MS;
        this._autoStartMonitor = options?.autoStartMonitor ?? true;
    }
    add(service, roles) {
        if (roles && roles.length > 0) {
            const currentRole = process.env.WORKER_ROLE;
            if (currentRole && !roles.includes(currentRole)) {
                return;
            }
        }
        this._services.push(service);
    }
    getByName(name) {
        return this._services.find(s => s.getServiceName() === name) || null;
    }
    getInfoList() {
        return this._services.map(service => {
            let schedulerInfo;
            if (service instanceof ServiceJobAbstract) {
                schedulerInfo = {
                    status: service.getStatusScheduler(),
                    inProcess: service.isProcessScheduler(),
                    lastRun: DateHelper.toStrOrNull(service.getLastRun()),
                    cron: service.getCron()
                };
            }
            return {
                type: service.getType(),
                name: service.getServiceName(),
                status: service.getStatus(),
                statusMsg: service.getStatusMsg(),
                importance: service.getImportance(),
                inProcess: service.isProcess(),
                dependencies: service.getServiceDependencies(),
                scheduler: schedulerInfo
            };
        });
    }
    async _startService(service) {
        const name = service.constructor.name;
        try {
            await service.start();
            Logger.getLogger().info(`Service started: ${name}`);
        }
        catch (error) {
            switch (service.getImportance()) {
                case ServiceImportance.Critical:
                    throw new Error(`Critical service '${name}' could not be started: ${error}`, { cause: error });
                case ServiceImportance.Important:
                    Logger.getLogger().error(`Important service '${name}' could not be started:`, error);
                    break;
                case ServiceImportance.Optional:
                    Logger.getLogger().warn(`Optional service '${name}' could not be started:`, error);
                    break;
            }
        }
    }
    _checkForCycles(service, visited = new Set(), stack = new Set()) {
        const name = service.getServiceName();
        if (stack.has(name)) {
            throw new Error(`Dependency cycle detected: ${[...stack, name].join(' -> ')}`);
        }
        if (visited.has(name)) {
            return;
        }
        visited.add(name);
        stack.add(name);
        for (const depName of service.getServiceDependencies()) {
            const depService = this.getByName(depName);
            if (!depService) {
                continue;
            }
            this._checkForCycles(depService, visited, stack);
        }
        stack.delete(name);
    }
    _areAllDepsSuccess(service) {
        for (const depName of service.getServiceDependencies()) {
            const dep = this.getByName(depName);
            if (!dep || dep.getStatus() !== ServiceStatus.Success) {
                return false;
            }
        }
        return true;
    }
    async startAll() {
        for (const service of this._services) {
            this._checkForCycles(service);
        }
        let waitingServices = [];
        for await (const service of this._services) {
            if (service.getServiceDependencies().length === 0 || this._areAllDepsSuccess(service)) {
                await this._startService(service);
            }
            else {
                waitingServices.push(service.getServiceName());
            }
        }
        const deadline = Date.now() + this._startAllTimeoutMs;
        while (waitingServices.length > 0 && Date.now() < deadline) {
            await new Promise((resolve) => {
                setTimeout(resolve, 500);
            });
            for (const waitService of [...waitingServices]) {
                const mService = this.getByName(waitService);
                if (mService === null) {
                    waitingServices = waitingServices.filter((s) => s !== waitService);
                    continue;
                }
                if (mService.getServiceDependencies().length === 0 || this._areAllDepsSuccess(mService)) {
                    await this._startService(mService);
                    waitingServices = waitingServices.filter((s) => s !== waitService);
                }
            }
        }
        if (waitingServices.length > 0) {
            Logger.getLogger().warn(`ServiceManager.startAll: ${waitingServices.length} service(s) still waiting after ` +
                `${this._startAllTimeoutMs}ms [${waitingServices.join(', ')}]. ` +
                'Health monitor will retry once their dependencies become healthy.');
        }
        if (this._autoStartMonitor) {
            this.startMonitor();
        }
    }
    async stopAll() {
        this.stopMonitor();
        const services = [...this._services].reverse();
        for await (const service of services) {
            try {
                await this._stopRecursive(service.getServiceName());
                Logger.getLogger().info(`Service stopped: ${service.constructor.name}`);
            }
            catch (error) {
                Logger.getLogger().warn(`Error stopping '${service.constructor.name}':`, error);
            }
        }
    }
    startMonitor() {
        if (this._monitor !== null) {
            return;
        }
        this._monitor = setInterval(() => {
            this._monitorTick().catch((error) => {
                Logger.getLogger().error('ServiceManager: monitor tick threw uncaught:', error);
            });
        }, this._monitorIntervalMs);
        this._monitor.unref();
    }
    stopMonitor() {
        if (this._monitor !== null) {
            clearInterval(this._monitor);
            this._monitor = null;
        }
    }
    async runMonitorTick() {
        await this._monitorTick();
    }
    async _monitorTick() {
        if (this._inTick) {
            return;
        }
        this._inTick = true;
        try {
            for (const service of this._services) {
                if (service.isProcess()) {
                    continue;
                }
                if (service.getImportance() !== ServiceImportance.Important) {
                    continue;
                }
                const status = service.getStatus();
                if (status === ServiceStatus.Error || status === ServiceStatus.None) {
                    if (this._areAllDepsSuccess(service)) {
                        await this._startService(service);
                    }
                    continue;
                }
                if (status === ServiceStatus.Success) {
                    const name = service.getServiceName();
                    const last = this._lastHealthCheckAt.get(name) ?? 0;
                    if (Date.now() - last < this._healthCheckIntervalMs) {
                        continue;
                    }
                    this._lastHealthCheckAt.set(name, Date.now());
                    let ok = false;
                    try {
                        ok = await service.healthCheck();
                    }
                    catch (error) {
                        Logger.getLogger().warn(`ServiceManager: healthCheck threw for '${name}', treating as unhealthy:`, error);
                        ok = false;
                    }
                    if (!ok) {
                        Logger.getLogger().warn(`ServiceManager: '${name}' became unhealthy`);
                        service.markUnhealthy('healthCheck reported unhealthy');
                    }
                }
            }
        }
        finally {
            this._inTick = false;
        }
    }
    async start(name) {
        const service = this.getByName(name);
        if (service === null) {
            throw new Error(`Service not found by name: ${name}`);
        }
        if (service.getStatus() === ServiceStatus.Success) {
            return;
        }
        if (service.isProcess()) {
            throw new Error(`Service already in processing: ${name}`);
        }
        const deps = service.getServiceDependencies();
        for (const dep of deps) {
            const depService = this.getByName(dep);
            if (depService === null) {
                throw new Error(`Dependencie-Service not found by name: ${dep}`);
            }
            if (depService.getStatus() !== ServiceStatus.Success) {
                throw new Error(`Dependencie-Service is not ready by name: ${dep}`);
            }
        }
        await this._startService(service);
    }
    async stop(name) {
        await this._stopRecursive(name);
    }
    async _stopRecursive(name, visited = new Set()) {
        if (visited.has(name)) {
            throw new Error(`Circular dependency detected while stopping: ${name}`);
        }
        visited.add(name);
        const dependents = this._services.filter(s => s.getServiceDependencies().includes(name));
        for (const dependent of dependents) {
            if (dependent.getStatus() === ServiceStatus.Success) {
                await this._stopRecursive(dependent.getServiceName(), visited);
            }
        }
        const service = this.getByName(name);
        if (service && service.getStatus() === ServiceStatus.Success) {
            await service.stop();
            Logger.getLogger().info(`Service stopped: ${service.getServiceName()}`);
        }
        else {
            if (service === null) {
                throw new Error(`Service not found by name: ${name}`);
            }
            if (service.getStatus() !== ServiceStatus.Success) {
                throw new Error(`The service has not successfully started to stop: ${name}`);
            }
        }
    }
    getNamespace() {
        return SERVICE_MANAGER_NAMESPACE;
    }
    serialize() {
        return this.getInfoList();
    }
    async invokeService(name) {
        const service = this.getByName(name);
        if (!service) {
            throw new Error(`Service not found: ${name}`);
        }
        if (service.isProcess()) {
            Logger.getLogger().warn(`Service ${name} is already running`);
            return;
        }
        await service.invoke();
        Logger.getLogger().info(`Service ${name} invoked manually`);
    }
}
//# sourceMappingURL=ServiceManager.js.map