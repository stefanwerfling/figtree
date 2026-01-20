import { ProviderEntry } from 'figtree_schemas';
import { IProvider } from './IProvider.js';
export interface IProviders<E extends ProviderEntry, T extends IProvider<E>> {
    getProvider(name: string): Promise<T | null>;
    getProviders(): Promise<T[]>;
}
