import { BaseProviders } from '../Provider/BaseProviders.js';
import { ServiceProviderType } from './ServiceProviderType.js';
export class ServiceProviders extends BaseProviders {
    constructor() {
        super(ServiceProviderType);
    }
    async getProvidersServices() {
        const providers = await this.getProviders();
        const lists = await Promise.all(providers.map((p) => p.getServices()));
        return lists.flat();
    }
}
//# sourceMappingURL=ServiceProviders.js.map