import { ProviderEntry } from 'figtree-schemas';
import { IProvider } from '../Provider/IProvider.js';
import { IACLController } from './IACLController.js';
export interface IACLContributionProvider extends IProvider<ProviderEntry> {
    getControllers(): IACLController[] | Promise<IACLController[]>;
}
