import { ProviderEntry } from '../Schemas/Provider/ProviderEntry.js';
import { IProvider } from './IProvider.js';
export declare class BaseProviders<E extends ProviderEntry, T extends IProvider<E>> {
    protected _getProvider(name: string, type: string): Promise<T | null>;
    protected _getProviders(type: string): Promise<E[]>;
}
