import { scheduleJob } from 'node-schedule';
import { ServiceAbstract, ServiceStatus, ServiceType } from './ServiceAbstract.js';
export class ServiceJobAbstract extends ServiceAbstract {
    _scheduler = null;
    _lastRun = null;
    _cron = '*/15 * * * *';
    _type = ServiceType.scheduler;
    _statusScheduler = ServiceStatus.None;
    _inProcessScheduler = false;
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
        this._scheduler = scheduleJob(this._cron, async () => {
            this._lastRun = new Date();
            this._inProcessScheduler = true;
            this._statusScheduler = ServiceStatus.Progress;
            try {
                await this._execute();
                this._statusScheduler = ServiceStatus.Success;
            }
            catch (e) {
                this._statusScheduler = ServiceStatus.Error;
                if (e instanceof Error) {
                    this._statusMsg = e.message || 'Unknown error';
                }
                else {
                    this._statusMsg = 'Unknown error';
                }
            }
            finally {
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
    static buildCron({ minute = '*', hour = '*', day = '*' }) {
        return `${minute} ${hour} ${day} * *`;
    }
}
//# sourceMappingURL=ServiceJobAbstract.js.map