import {ServiceImportance} from 'figtree-schemas';
import {Logger, ServiceJobAbstract} from 'figtree';

/**
 * Demo cron job — fires every minute and logs.
 *
 * Registered with the `['cron']` role filter so it only runs on the cron
 * worker. In a multi-host setup, gate it additionally behind a `ClusterLeader`
 * so it runs exactly once cluster-wide.
 */
export class HelloCronJob extends ServiceJobAbstract {

    public static NAME = 'hello_cron';

    protected override readonly _importance: ServiceImportance = ServiceImportance.Optional;

    /** Every minute. */
    protected override _cron: string = '* * * * *';

    public constructor() {
        super(HelloCronJob.NAME);
    }

    protected override async _execute(): Promise<void> {
        Logger.getLogger().info(`HelloCronJob fired in PID ${process.pid}`);
    }

}