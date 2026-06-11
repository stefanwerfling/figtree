import {ServiceStatus, ServiceType} from 'figtree-schemas';
import {Job, scheduleJob} from 'node-schedule';
import {ServiceAbstract} from './ServiceAbstract.js';

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
     * Wall-clock time of the last successful tick. Distinct from
     * `_lastRun` (which is set whether the tick threw or not) — this
     * answers "when did the service last actually work?".
     * @protected
     */
    protected _lastSuccessAt: Date | null = null;

    /**
     * Duration of the most recent tick in milliseconds. Null before
     * the first tick. Set in the `finally` block so failed runs are
     * timed too.
     * @protected
     */
    protected _lastDurationMs: number | null = null;

    /**
     * Number of cron ticks (success + failure) since the most recent
     * call to `start()`. Reset on each start.
     * @protected
     */
    protected _runCount: number = 0;

    /**
     * Subset of `_runCount` whose `_execute()` threw. Reset on each
     * start.
     * @protected
     */
    protected _failCount: number = 0;

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
     * @return {ServiceStatus}
     */
    public getStatusScheduler(): ServiceStatus {
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

        // Reset tick-level counters — runCount / failCount /
        // lastSuccessAt are documented as "since the service was last
        // started", so stop+start gives the operator a clean slate.
        this._inProcessScheduler = false;
        this._statusScheduler = ServiceStatus.None;
        this._lastRun = null;
        this._lastSuccessAt = null;
        this._lastDurationMs = null;
        this._runCount = 0;
        this._failCount = 0;

        this._scheduler = scheduleJob(this._cron, async(): Promise<void> => {
            const tickStart = Date.now();
            this._lastRun = new Date();
            this._inProcessScheduler = true;
            this._statusScheduler = ServiceStatus.Progress;
            this._runCount += 1;

            try {
                await this._execute();
                this._statusScheduler = ServiceStatus.Success;
                this._statusMsg = '';
                this._lastSuccessAt = new Date();
            } catch (e: unknown) {
                this._statusScheduler = ServiceStatus.Error;
                this._failCount += 1;

                const msg = e instanceof Error ? (e.message || 'Unknown error') : 'Unknown error';
                this._statusMsg = msg;

                this.getLogger().error(
                    `Service '${this.getServiceName()}' scheduled run failed: ${msg}`,
                    e
                );
            } finally {
                this._lastDurationMs = Date.now() - tickStart;
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
     * Return when the last successful (non-throwing) run finished, or
     * null if no run has succeeded since the last `start()`.
     * @return {Date|null}
     */
    public getLastSuccessAt(): Date | null {
        return this._lastSuccessAt;
    }

    /**
     * Return the next planned run as predicted by node-schedule, or
     * null when the scheduler is not currently active.
     * @return {Date|null}
     */
    public getNextRun(): Date | null {
        if (this._scheduler === null) {
            return null;
        }

        const next = this._scheduler.nextInvocation();

        if (next === null || next === undefined) {
            return null;
        }

        // node-schedule returns a `CronDate` (Date-compatible) or null.
        return next as Date;
    }

    /**
     * Return the wall-clock duration of the most recent tick in ms,
     * or null if the service hasn't ticked since the last start.
     * @return {number|null}
     */
    public getLastDurationMs(): number | null {
        return this._lastDurationMs;
    }

    /**
     * Return the total number of ticks (success + failure) since the
     * service was last started.
     * @return {number}
     */
    public getRunCount(): number {
        return this._runCount;
    }

    /**
     * Return the subset of {@link getRunCount} whose `_execute()`
     * threw.
     * @return {number}
     */
    public getFailCount(): number {
        return this._failCount;
    }

    /**
     * Return the cron string
     * @return {string}
     */
    public getCron(): string {
        return this._cron;
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
        minute?: string | number;
        hour?: string | number;
        day?: string | number;
    }): string {
        return `${minute} ${hour} ${day} * *`;
    }

    /**
     * invoke the scheduler
     */
    public override async invoke(): Promise<void> {
        if (this._scheduler === null) {
            this.getLogger().error(
                `Service '${this.getServiceName()}' is not running — start the service before invoking`
            );
            return;
        }

        this.getLogger().info(`Job ${this.getServiceName()} invoked manually`);
        this._scheduler.invoke();
    }

}