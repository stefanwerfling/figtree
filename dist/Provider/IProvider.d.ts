import { ProviderEntry } from '../Schemas/Provider/ProviderEntry.js';
export interface IProvider<E extends ProviderEntry> {
    getName(): string;
    getTitle(): string;
    getType(): string;
    getProviderEntry(): E;
}
