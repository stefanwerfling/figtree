import {ProviderEntry} from '../Schemas/Provider/ProviderEntry.js';

/**
 * Interface for a Provider
 */
export interface IProvider<E extends ProviderEntry> {

    /**
     * Return the keyname for provider as ident.
     * @returns {string}
     */
    getName(): string;

    /**
     * Return the title for provider (for frontend).
     * @returns {string}
     */
    getTitle(): string;

    /**
     * Return the type of provider
     * @returns {string}
     */
    getType(): string;

    /**
     * Return the provider entry
     * @returns {E extends ProviderEntry}
     */
    getProviderEntry(): E;

}