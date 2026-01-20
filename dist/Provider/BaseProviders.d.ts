import { ProviderEntry } from 'figtree_schemas';
import { IProvider } from './IProvider.js';
import { IProviders } from './IProviders.js';
export declare class BaseProviders<E extends ProviderEntry, T extends IProvider<E>> implements IProviders<E, T> {
    protected _providerType: string;
    constructor(providerType: string);
    protected _getProvider(name: string, type: string): Promise<T | null>;
    getProvider(name: string): Promise<T | null>;
    protected _getProviders(type: string): Promise<T[]>;
    getProviders(): Promise<T[]>;
    protected _getProvidersEntries(type: string): Promise<E[]>;
    getProvidersEntries(): Promise<E[]>;
}
