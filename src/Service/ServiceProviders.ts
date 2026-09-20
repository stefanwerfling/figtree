import {ProviderEntry} from 'figtree-schemas';
import {BaseProviders} from '../Provider/BaseProviders.js';
import {IServiceProvider, ServiceProviderService} from './IServiceProvider.js';
import {ServiceProviderType} from './ServiceProviderType.js';

/**
 * Collects services from all loaded plugins.
 */
export class ServiceProviders extends BaseProviders<ProviderEntry, IServiceProvider> {

    public constructor() {
        super(ServiceProviderType);
    }

    /**
     * Return the flattened list of services contributed by every registered
     * provider, in the order their providers were registered. Each provider's
     * `getServices()` may return one or more services.
     * @return {ServiceProviderService[]}
     */
    public async getProvidersServices(): Promise<ServiceProviderService[]> {
        const providers = await this.getProviders();
        const lists = await Promise.all(providers.map((p) => p.getServices()));

        return lists.flat();
    }

}