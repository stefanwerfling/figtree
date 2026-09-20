import { ProviderEntry } from 'figtree-schemas';
import { IProvider } from '../Provider/IProvider.js';
import { ServiceAbstract } from './ServiceAbstract.js';
export interface ServiceProviderService {
    service: ServiceAbstract;
    roles?: string[];
}
export interface IServiceProvider extends IProvider<ProviderEntry> {
    getServices(): ServiceProviderService[] | Promise<ServiceProviderService[]>;
}
