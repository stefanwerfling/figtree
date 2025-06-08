import {PluginManager} from '../Plugins/PluginManager.js';
import {ProviderEntry} from '../Schemas/Provider/ProviderEntry.js';
import {AProviderOnLoadEvent} from './AProviderOnLoadEvent.js';
import {IProvider} from './IProvider.js';
import {IProviders} from './IProviders.js';

/**
 * Base Provider
 * @template E extends ProviderEntry, T extends IProvider<E>
 */
export class BaseProviders<E extends ProviderEntry, T extends IProvider<E>> implements IProviders<E, T> {

    /**
     * Provider type
     * @protected
     */
    protected _providerType: string;

    /**
     * constructor
     * @param {string} providerType
     */
    public constructor(providerType: string) {
        this._providerType = providerType;
    }

    /**
     * Return a provider by name
     * @param {string} name
     * @param {string} type
     * @protected
     * @returns {T|null}
     */
    protected async _getProvider(name: string, type: string): Promise<T | null> {
        const events = PluginManager.getInstance().getAllEvents<AProviderOnLoadEvent<E, T>>(AProviderOnLoadEvent<E, T>);

        for await (const event of events) {
            const providers = await event.getProviders();

            for (const provider of providers) {
                if (provider.getType() === type && provider.getName() === name) {
                    return provider;
                }
            }
        }

        return null;
    }

    /**
     * Return a provider by name (and by provider type)
     * @param {string} name
     * @return {T|null}
     */
    public async getProvider(name: string): Promise<T|null> {
        return this._getProvider(name, this._providerType);
    }

    /**
     * Get all providers by type
     * @param {string} type
     * @return {T[]}
     * @protected
     */
    protected async _getProviders(type: string): Promise<T[]> {
        const list: T[] = [];

        const events = PluginManager.getInstance().getAllEvents<AProviderOnLoadEvent<E, T>>(AProviderOnLoadEvent<E, T>);

        for await (const event of events) {
            const providers = await event.getProviders();

            for (const provider of providers) {
                if (provider.getType() === type) {
                    list.push(provider);
                }
            }
        }

        return list;
    }

    /**
     * Get all providers
     * @return {T[]}
     */
    public async getProviders(): Promise<T[]> {
        return this._getProviders(this._providerType);
    }

    /**
     * Get a provider list with name and title.
     * @param {string} type
     * @protected
     * @returns {E[]}
     */
    protected async _getProvidersEntries(type: string): Promise<E[]> {
        const list: E[] = [];

        const events = PluginManager.getInstance().getAllEvents<AProviderOnLoadEvent<E, T>>(AProviderOnLoadEvent<E, T>);

        for await (const event of events) {
            const providers = await event.getProviders();

            for (const provider of providers) {
                if (provider.getType() === type) {
                    list.push(provider.getProviderEntry());
                }
            }
        }

        return list;
    }

    /**
     * Return providers entries
     * @return {E[]}
     */
    public async getProvidersEntries(): Promise<E[]> {
        return this._getProvidersEntries(this._providerType);
    }
}