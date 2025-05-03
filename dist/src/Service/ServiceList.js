import { Logger } from '../Logger/Logger.js';
import { ServiceImportance } from './ServiceAbstract.js';
export class ServiceList {
    _services = [];
    add(service) {
        this._services.push(service);
    }
    async startAll() {
        for await (const service of this._services) {
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
//# sourceMappingURL=ServiceList.js.map