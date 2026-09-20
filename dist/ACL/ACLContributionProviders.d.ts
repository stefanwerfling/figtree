import { ProviderEntry } from 'figtree-schemas';
import { BaseProviders } from '../Provider/BaseProviders.js';
import { IACLContributionProvider } from './IACLContributionProvider.js';
import { IACLController } from './IACLController.js';
export declare class ACLContributionProviders extends BaseProviders<ProviderEntry, IACLContributionProvider> {
    constructor();
    getProvidersControllers(): Promise<IACLController[]>;
}
