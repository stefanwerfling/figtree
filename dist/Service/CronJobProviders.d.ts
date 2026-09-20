import { ProviderEntry } from 'figtree-schemas';
import { BaseProviders } from '../Provider/BaseProviders.js';
import { ICronJobProvider } from './ICronJobProvider.js';
import { ServiceProviderService } from './IServiceProvider.js';
export declare const DEFAULT_CRON_ROLES: string[];
export declare class CronJobProviders extends BaseProviders<ProviderEntry, ICronJobProvider> {
    constructor();
    getProvidersJobs(): Promise<ServiceProviderService[]>;
}
