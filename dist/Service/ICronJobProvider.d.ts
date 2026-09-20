import { ProviderEntry } from 'figtree-schemas';
import { IProvider } from '../Provider/IProvider.js';
import { ServiceJobAbstract } from './ServiceJobAbstract.js';
export interface CronJobProviderJob {
    job: ServiceJobAbstract;
    roles?: string[];
}
export interface ICronJobProvider extends IProvider<ProviderEntry> {
    getCronJobs(): CronJobProviderJob[] | Promise<CronJobProviderJob[]>;
}
