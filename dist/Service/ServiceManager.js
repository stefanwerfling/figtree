import { Logger } from '../Logger/Logger.js';
import { ServiceImportance, ServiceStatus } from './ServiceAbstract.js';
export class ServiceManager {
    _services = [];
    add(service) {
        this._services.push(service);
    }
    getByName(name) {
        for (const service of this._services) {
            if (service.getServiceName() === name) {
                return service;
            }
        }
        return null;
    }
    getInfoList() {
        const list = [];
        for (const service of this._services) {
            list.push({
                type: service.getType(),
                name: service.getServiceName(),
                status: service.getStatus(),
                statusMsg: service.getStatusMsg(),
                importance: service.getImportance(),
                inProcess: service.isProcess(),
                dependencies: service.getServiceDependencies()
            });
        }
        return list;
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
    async startAll() {
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
            for (const waitService of waitingServices) {
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
                await service.stop();
                Logger.getLogger().info(`Service stopped: ${service.constructor.name}`);
            }
            catch (error) {
                Logger.getLogger().warn(`Error stopping '${service.constructor.name}':`, error);
            }
        }
    }
}
//# sourceMappingURL=ServiceManager.js.map