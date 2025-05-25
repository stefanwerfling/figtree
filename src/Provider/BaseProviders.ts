import {PluginManager} from '../Plugins/PluginManager.js';
import {ProviderEntry} from '../Schemas/Provider/ProviderEntry.js';
import {AProviderOnLoadEvent} from './AProviderOnLoadEvent.js';
import {IProvider} from './IProvider.js';

/**
 * Base Provider
 * @template E, T
 */
export class BaseProviders<E extends ProviderEntry, T extends IProvider<E>> {

    /**
     * Return a provider by name
     * @param {string} name
     * @param {string} type
     * @protected
     * @returns {T extends IProvider|null}
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
     * Get a provider list with name and title.
     * @param {string} type
     * @protected
     * @returns {E[]}
     */
    protected async _getProviders(type: string): Promise<E[]> {
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

}