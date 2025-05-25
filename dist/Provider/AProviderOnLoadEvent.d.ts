import { APluginEvent } from '../Plugins/APluginEvent.js';
import { ProviderEntry } from '../Schemas/Provider/ProviderEntry.js';
import { IProvider } from './IProvider.js';
export declare abstract class AProviderOnLoadEvent<E extends ProviderEntry, T extends IProvider<E>> extends APluginEvent {
    abstract getProviders(): Promise<T[]>;
}
