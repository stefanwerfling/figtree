import {ServiceInfoEntry} from 'figtree-schemas';
import {Logger} from '../Logger/Logger.js';
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
        return this._services.find(s => s.getServiceName() === name) || null;
    }

    /**
     * Return an info list by services
     * @return {ServiceInfoEntry[]}
     */
    public getInfoList(): ServiceInfoEntry[] {
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

    /**
     * start the service
     * @param {ServiceAbstract} service
     * @protected
     */
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
     * check for cycles dependencies
     * @param {ServiceAbstract} service
     * @param {Set<string>} visited
     * @param {Set<string>} stack
     * @private
     */
    private _checkForCycles(service: ServiceAbstract, visited: Set<string> = new Set(), stack: Set<string> = new Set()): void {
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

    /**
     * Start all Services
     */
    public async startAll(): Promise<void> {
        // check cycles ------------------------------------------------------------------------------------------------

        for (const service of this._services) {
            this._checkForCycles(service);
        }

        // start services ----------------------------------------------------------------------------------------------

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

            for (const waitService of [...waitingServices]) {
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
                await this._stopRecursive(service.getServiceName());

                Logger.getLogger().info(`Service stopped: ${service.constructor.name}`);
            } catch (error) {
                Logger.getLogger().warn(`Error stopping '${service.constructor.name}':`, error);
            }
        }
    }

    /**
     * Start a service by name
     * @param {string} name
     * @throws {Error}
     */
    public async start(name: string): Promise<void> {
        const service = this.getByName(name);

        // -------------------------------------------------------------------------------------------------------------

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

        // -------------------------------------------------------------------------------------------------------------

        await this._startService(service);
    }

    /**
     * Stop a service by name
     * @param {string} name
     */
    public async stop(name: string): Promise<void> {
        await this._stopRecursive(name);
    }

    /**
     * stop service with dependency
     * @param {string} name
     * @param {Set<string>} visited
     * @private
     */
    private async _stopRecursive(name: string, visited: Set<string> = new Set()): Promise<void> {
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
        } else {
            if (service === null) {
                throw new Error(`Service not found by name: ${name}`);
            }

            if (service.getStatus() !== ServiceStatus.Success) {
                throw new Error(`The service has not successfully started to stop: ${name}`);
            }
        }
    }

    /**
     * invoke a service by name
     * @param {string} name
     */
    public async invokeService(name: string): Promise<void> {
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