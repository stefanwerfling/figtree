import { ProviderEntry } from 'figtree-schemas';
export interface IProvider<E extends ProviderEntry> {
    getName(): string;
    getTitle(): string;
    getType(): string;
    getProviderEntry(): E;
}
