import { ServiceStatus, ServiceType } from 'figtree-schemas';
import { scheduleJob } from 'node-schedule';
import { ServiceAbstract } from './ServiceAbstract.js';
export class ServiceJobAbstract extends ServiceAbstract {
    _scheduler = null;
    _lastRun = null;
    _cron = '*/15 * * * *';
    _type = ServiceType.scheduler;
    _statusScheduler = ServiceStatus.None;
    _inProcessScheduler = false;
    _lastSuccessAt = null;
    _lastDurationMs = null;
    _runCount = 0;
    _failCount = 0;
    constructor(serviceName, serviceDependencies) {
        super(serviceName, serviceDependencies);
    }
    isProcessScheduler() {
        return this._inProcessScheduler;
    }
    getStatusScheduler() {
        return this._statusScheduler;
    }
    async start() {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;
        if (this._scheduler) {
            this._scheduler.cancel();
        }
        this._inProcessScheduler = false;
        this._statusScheduler = ServiceStatus.None;
        this._lastRun = null;
        this._lastSuccessAt = null;
        this._lastDurationMs = null;
        this._runCount = 0;
        this._failCount = 0;
        this._scheduler = scheduleJob(this._cron, async () => {
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
            }
            catch (e) {
                this._statusScheduler = ServiceStatus.Error;
                this._failCount += 1;
                const msg = e instanceof Error ? (e.message || 'Unknown error') : 'Unknown error';
                this._statusMsg = msg;
                this.getLogger().error(`Service '${this.getServiceName()}' scheduled run failed: ${msg}`, e);
            }
            finally {
                this._lastDurationMs = Date.now() - tickStart;
                this._inProcessScheduler = false;
            }
        });
        this._status = ServiceStatus.Success;
        this._inProcess = false;
    }
    async stop(forced = false) {
        if (this._scheduler) {
            this._scheduler.cancel();
            this._scheduler = null;
        }
        this._inProcess = false;
        this._status = forced ? ServiceStatus.None : this._status;
    }
    async reload() {
        await this.stop();
        await this.start();
    }
    async changeSchedule(cronExpression) {
        this._cron = cronExpression;
        await this.reload();
    }
    getLastRun() {
        return this._lastRun;
    }
    getLastSuccessAt() {
        return this._lastSuccessAt;
    }
    getNextRun() {
        if (this._scheduler === null) {
            return null;
        }
        const next = this._scheduler.nextInvocation();
        if (next === null || next === undefined) {
            return null;
        }
        return next;
    }
    getLastDurationMs() {
        return this._lastDurationMs;
    }
    getRunCount() {
        return this._runCount;
    }
    getFailCount() {
        return this._failCount;
    }
    getCron() {
        return this._cron;
    }
    static buildCron({ minute = '*', hour = '*', day = '*' }) {
        return `${minute} ${hour} ${day} * *`;
    }
    async invoke() {
        if (this._scheduler === null) {
            this.getLogger().error(`Service '${this.getServiceName()}' is not running — start the service before invoking`);
            return;
        }
        this.getLogger().info(`Job ${this.getServiceName()} invoked manually`);
        this._scheduler.invoke();
    }
}
//# sourceMappingURL=ServiceJobAbstract.js.map