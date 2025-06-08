import {ProviderEntry} from '../Schemas/Provider/ProviderEntry.js';
import {IProvider} from './IProvider.js';

/**
 * Interface for Providers object
 * @template E extends ProviderEntry, T extends IProvider<E>
 */
export interface IProviders<E extends ProviderEntry, T extends IProvider<E>> {

    /**
     * Return the provider by name
     * @param {string} name
     * @returns {IProvider|null}
     */
    getProvider(name: string): Promise<T|null>;

    /**
     * Return all providers
     * @returns {T}
     */
    getProviders(): Promise<T[]>;

}