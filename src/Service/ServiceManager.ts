import {Logger} from '../Logger/Logger.js';
import {ServiceInfoEntry} from '../Schemas/Service/ServiceInfoEntry.js';
import {ServiceAbstract, ServiceImportance, ServiceStatus} from './ServiceAbstract.js';

/**
 * Service Manager
 */
export class ServiceManager {

    /**
     * Services
     * @protected
     */
    protected _services: ServiceAbstract[] = [];

    /**
     * Add a Service
     * @param {ServiceAbstract} service
     */
    public add(service: ServiceAbstract): void {
        this._services.push(service);
    }

    /**
     * Return the service by name
     * @param {string} name
     * @return {ServiceAbstract|null}
     */
    public getByName(name: string): ServiceAbstract|null {
        for (const service of this._services) {
            if (service.getServiceName() === name) {
                return service;
            }
        }

        return null;
    }

    /**
     * Return an info list by services
     * @return {ServiceInfoEntry[]}
     */
    public getInfoList(): ServiceInfoEntry[] {
        const list: ServiceInfoEntry[] = [];

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

    protected async _startService(service: ServiceAbstract): Promise<void> {
        const name = service.constructor.name;

        try {
            await service.start();
            Logger.getLogger().info(`Service started: ${name}`);
        } catch (error) {
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

    /**
     * Start all Services
     */
    public async startAll(): Promise<void> {
        let waitingServices: string[] = [];

        for await (const service of this._services) {
            const deps = service.getServiceDependencies();

            if (deps.length > 0 ) {
                let isReady = true;

                for (const dep of deps) {
                    const tservice = this.getByName(dep);

                    if (tservice) {
                        if (tservice.getStatus() !== ServiceStatus.Success) {
                            isReady = false;
                        }
                    } else {
                        isReady = false;
                    }
                }

                if (isReady) {
                    await this._startService(service);
                } else {
                    waitingServices.push(service.getServiceName());
                }
            } else {
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

                if (deps.length === 0 ) {
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
                    } else {
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

    /**
     * Stop all Services
     */
    public async stopAll(): Promise<void> {
        const services = [...this._services].reverse();

        for await (const service of services) {
            try {
                await service.stop();

                Logger.getLogger().info(`Service stopped: ${service.constructor.name}`);
            } catch (error) {
                Logger.getLogger().warn(`Error stopping '${service.constructor.name}':`, error);
            }
        }
    }
}