import {ProviderEntry} from 'figtree-schemas';
import {BaseProviders} from '../Provider/BaseProviders.js';
import {CronJobProviderType} from './CronJobProviderType.js';
import {ICronJobProvider} from './ICronJobProvider.js';
import {ServiceProviderService} from './IServiceProvider.js';

/**
 * Default cluster roles applied to a plugin cron job when the provider does not
 * specify any. See {@link ICronJobProvider}.
 */
export const DEFAULT_CRON_ROLES: string[] = ['cron'];

/**
 * Collects cron jobs from all loaded plugins.
 */
export class CronJobProviders extends BaseProviders<ProviderEntry, ICronJobProvider> {

    public constructor() {
        super(CronJobProviderType);
    }

    /**
     * Return the flattened list of cron jobs contributed by every registered
     * provider, normalized to the same `{service, roles}` shape as
     * `ServiceProviders` so a caller can register them through one path. Each
     * job's `roles` defaults to `['cron']` when the provider omitted it; an
     * explicit empty array is preserved (runs everywhere).
     * @return {ServiceProviderService[]}
     */
    public async getProvidersJobs(): Promise<ServiceProviderService[]> {
        const providers = await this.getProviders();
        const lists = await Promise.all(providers.map((p) => p.getCronJobs()));

        return lists.flat().map((entry) => ({
            service: entry.job,
            roles: entry.roles ?? DEFAULT_CRON_ROLES
        }));
    }

}