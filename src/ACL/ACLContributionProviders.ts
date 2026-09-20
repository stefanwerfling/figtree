import {ProviderEntry} from 'figtree-schemas';
import {BaseProviders} from '../Provider/BaseProviders.js';
import {ACLContributionProviderType} from './ACLContributionProviderType.js';
import {IACLContributionProvider} from './IACLContributionProvider.js';
import {IACLController} from './IACLController.js';

/**
 * Collects ACL controllers from all loaded plugins.
 */
export class ACLContributionProviders extends BaseProviders<ProviderEntry, IACLContributionProvider> {

    public constructor() {
        super(ACLContributionProviderType);
    }

    /**
     * Return the flattened list of ACL controllers contributed by every
     * registered provider, in the order their providers were registered. Each
     * provider's `getControllers()` may return one or more controllers.
     * @return {IACLController[]}
     */
    public async getProvidersControllers(): Promise<IACLController[]> {
        const providers = await this.getProviders();
        const lists = await Promise.all(providers.map((p) => p.getControllers()));

        return lists.flat();
    }

}