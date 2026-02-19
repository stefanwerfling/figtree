import {Job, scheduleJob} from 'node-schedule';
import {ServiceAbstract, ServiceStatus, ServiceType} from './ServiceAbstract.js';

/**
 * Service job abstract
 */
export abstract class ServiceJobAbstract extends ServiceAbstract {

    /**
     * Scheduler job
     * @protected
     */
    protected _scheduler: Job|null = null;

    /**
     * Last run
     * @protected
     */
    protected _lastRun: Date | null = null;

    /**
     * Default cron expression
     * @protected
     */
    protected _cron: string = '*/15 * * * *';

    /**
     * Service type override
     */
    protected _type = ServiceType.scheduler;

    /**
     * Status scheduler
     * @protected
     */
    protected _statusScheduler: ServiceStatus = ServiceStatus.None;

    /**
     * in process scheduler
     * @protected
     */
    protected _inProcessScheduler: boolean = false;

    /**
     * constructor
     * @param {string} serviceName
     * @param {string[]} serviceDependencies
     */
    public constructor(serviceName?: string, serviceDependencies?: string[]) {
        super(serviceName, serviceDependencies);
    }

    /**
     * Return, is scheduler in process
     * @returns {boolean}
     */
    public isProcessScheduler(): boolean {
        return this._inProcessScheduler;
    }

    /**
     * Return the scheduler status
     * @return {string|ServiceStatus}
     */
    public getStatusScheduler(): string|ServiceStatus {
        return this._statusScheduler;
    }

    /**
     * _execute for scheduler
     * child claesses implement this
     * @protected
     */
    protected abstract _execute(): Promise<void>;

    /**
     * Start schedule service
     */
    public override async start(): Promise<void> {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;

        if (this._scheduler) {
            this._scheduler.cancel();
        }

        this._inProcessScheduler = false;
        this._statusScheduler = ServiceStatus.None;

        this._scheduler = scheduleJob(this._cron, async(): Promise<void> => {
            this._lastRun = new Date();
            this._inProcessScheduler = true;
            this._statusScheduler = ServiceStatus.Progress;

            try {
                await this._execute();
                this._statusScheduler = ServiceStatus.Success;
            } catch (e: unknown) {
                this._statusScheduler = ServiceStatus.Error;

                if (e instanceof Error) {
                    this._statusMsg = e.message || 'Unknown error';
                } else {
                    this._statusMsg = 'Unknown error';
                }
            } finally {
                this._inProcessScheduler = false;
            }
        });

        this._status = ServiceStatus.Success;
        this._inProcess = false;
    }

    /**
     * Stop schedule service
     * @param {boolean} forced
     */
    public override async stop(forced: boolean = false): Promise<void> {
        if (this._scheduler) {
            this._scheduler.cancel();
            this._scheduler = null;
        }

        this._inProcess = false;
        this._status = forced ? ServiceStatus.None : this._status;
    }

    /**
     * Reloade the schedule service
     */
    public override async reload(): Promise<void> {
        await this.stop();
        await this.start();
    }

    /**
     * Change the cron for schedule and reload the schedule
     * @param {string} cronExpression
     */
    public async changeSchedule(cronExpression: string): Promise<void> {
        this._cron = cronExpression;
        await this.reload();
    }

    /**
     * Return the last run
     * @return {Date|null}
     */
    public getLastRun(): Date|null {
        return this._lastRun;
    }

    /**
     * Build the cron
     * @param {string|number} minute
     * @param {string|number} hour
     * @param {string|number} day
     */
    public static buildCron({
        minute = '*',
        hour = '*',
        day = '*'
    }: {
        minute?: string | number,
        hour?: string | number,
        day?: string | number
    }): string {
        return `${minute} ${hour} ${day} * *`;
    }

}