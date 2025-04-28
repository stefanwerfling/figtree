import {ServiceAbstract} from './ServiceAbstract.js';

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
            await service.start();
        }
    }

    /**
     * Stop all Services
     */
    public async stopAll(): Promise<void> {
        const services = this._services.reverse();

        for await (const service of services) {
            await service.stop();
        }
    }
}