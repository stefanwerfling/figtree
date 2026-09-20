import { BaseProviders } from '../Provider/BaseProviders.js';
import { ACLContributionProviderType } from './ACLContributionProviderType.js';
export class ACLContributionProviders extends BaseProviders {
    constructor() {
        super(ACLContributionProviderType);
    }
    async getProvidersControllers() {
        const providers = await this.getProviders();
        const lists = await Promise.all(providers.map((p) => p.getControllers()));
        return lists.flat();
    }
}
//# sourceMappingURL=ACLContributionProviders.js.map