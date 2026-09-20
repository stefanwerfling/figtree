import { ProviderEntry } from 'figtree-schemas';
import { BaseProviders } from '../Provider/BaseProviders.js';
import { IServiceProvider, ServiceProviderService } from './IServiceProvider.js';
export declare class ServiceProviders extends BaseProviders<ProviderEntry, IServiceProvider> {
    constructor();
    getProvidersServices(): Promise<ServiceProviderService[]>;
}
