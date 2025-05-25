import {APluginEvent} from '../Plugins/APluginEvent.js';
import {ProviderEntry} from '../Schemas/Provider/ProviderEntry.js';
import {IProvider} from './IProvider.js';

/**
 * Provider on load event
 * @template E, T, E
 */
export abstract class AProviderOnLoadEvent<E extends ProviderEntry, T extends IProvider<E>> extends APluginEvent {

    /**
     * Return all supported Providers.
     * @returns {T[]}
     */
    public abstract getProviders(): Promise<T[]>;

}