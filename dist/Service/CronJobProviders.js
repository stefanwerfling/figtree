import { BaseProviders } from '../Provider/BaseProviders.js';
import { CronJobProviderType } from './CronJobProviderType.js';
export const DEFAULT_CRON_ROLES = ['cron'];
export class CronJobProviders extends BaseProviders {
    constructor() {
        super(CronJobProviderType);
    }
    async getProvidersJobs() {
        const providers = await this.getProviders();
        const lists = await Promise.all(providers.map((p) => p.getCronJobs()));
        return lists.flat().map((entry) => ({
            service: entry.job,
            roles: entry.roles ?? DEFAULT_CRON_ROLES
        }));
    }
}
//# sourceMappingURL=CronJobProviders.js.map