import { Logger } from '../Logger/Logger.js';
import { ServiceImportance, ServiceStatus } from './ServiceAbstract.js';
export class ServiceManager {
    _services = [];
    add(service) {
        this._services.push(service);
    }
    getByName(name) {
        return this._services.find(s => s.getServiceName() === name) || null;
    }
    getInfoList() {
        return this._services.map(service => ({
            type: service.getType(),
            name: service.getServiceName(),
            status: service.getStatus(),
            statusMsg: service.getStatusMsg(),
            importance: service.getImportance(),
            inProcess: service.isProcess(),
            dependencies: service.getServiceDependencies()
        }));
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
                    throw new Error(`Critical service '${name}' could not be started: ${error}`);
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
    async startAll() {
        for (const service of this._services) {
            this._checkForCycles(service);
        }
        let waitingServices = [];
        for await (const service of this._services) {
            const deps = service.getServiceDependencies();
            if (deps.length > 0) {
                let isReady = true;
                for (const dep of deps) {
                    const tservice = this.getByName(dep);
                    if (tservice) {
                        if (tservice.getStatus() !== ServiceStatus.Success) {
                            isReady = false;
                        }
                    }
                    else {
                        isReady = false;
                    }
                }
                if (isReady) {
                    await this._startService(service);
                }
                else {
                    waitingServices.push(service.getServiceName());
                }
            }
            else {
                await this._startService(service);
            }
        }
        while (waitingServices.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            for (const waitService of [...waitingServices]) {
                const mService = this.getByName(waitService);
                if (mService === null) {
                    waitingServices = waitingServices.filter(service => service !== waitService);
                    break;
                }
                const deps = mService.getServiceDependencies();
                if (deps.length === 0) {
                    waitingServices = waitingServices.filter(service => service !== waitService);
                    break;
                }
                let isReady = true;
                for (const dep of deps) {
                    const tservice = this.getByName(dep);
                    if (tservice) {
                        if (tservice.getStatus() !== ServiceStatus.Success) {
                            isReady = false;
                        }
                    }
                    else {
                        isReady = false;
                    }
                }
                if (isReady) {
                    await this._startService(mService);
                    waitingServices = waitingServices.filter(service => service !== waitService);
                    break;
                }
            }
        }
    }
    async stopAll() {
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
}
//# sourceMappingURL=ServiceManager.js.map