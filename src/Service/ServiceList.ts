import {Logger} from '../Logger/Logger.js';
import {ServiceAbstract, ServiceImportance} from './ServiceAbstract.js';

/**
 * Service List
 */
export class ServiceList {

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
     * Start all Services
     */
    public async startAll(): Promise<void> {
        for await (const service of this._services) {
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