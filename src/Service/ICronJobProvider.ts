import {ProviderEntry} from 'figtree-schemas';
import {IProvider} from '../Provider/IProvider.js';
import {ServiceJobAbstract} from './ServiceJobAbstract.js';

/**
 * A single cron job contributed by a plugin, together with the optional cluster
 * roles it should run on.
 *
 * Unlike a plain `IServiceProvider`, when `roles` is omitted the job defaults to
 * running only on `cron`-role workers (`['cron']`) — the common case for a
 * role-based cluster. Pass an explicit empty array (`roles: []`) to opt out and
 * run the job everywhere, or a custom list to target other roles. In
 * single-process mode (no `WORKER_ROLE`) the role filter never skips, so the
 * default is harmless there.
 */
export interface CronJobProviderJob {

    /**
     * The cron job instance to register with the `ServiceManager`.
     */
    job: ServiceJobAbstract;

    /**
     * Optional cluster roles this job should run on. Omitted → `['cron']`.
     * An explicit empty array means "run everywhere".
     */
    roles?: string[];
}

/**
 * Interface for a cron job provider — a plugin contributing one or more
 * `ServiceJobAbstract` instances. A specialization of the service provider
 * concept: jobs are registered with the host's `ServiceManager` before
 * `startAll()` runs, defaulting to the `cron` cluster role.
 */
export interface ICronJobProvider extends IProvider<ProviderEntry> {

    /**
     * Return one or more cron jobs to register. May be sync or async.
     * @return {CronJobProviderJob[]}
     */
    getCronJobs(): CronJobProviderJob[] | Promise<CronJobProviderJob[]>;

}