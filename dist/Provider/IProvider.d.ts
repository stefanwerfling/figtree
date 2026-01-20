import { ProviderEntry } from 'figtree_schemas';
export interface IProvider<E extends ProviderEntry> {
    getName(): string;
    getTitle(): string;
    getType(): string;
    getProviderEntry(): E;
}
