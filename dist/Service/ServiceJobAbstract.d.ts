import { ServiceStatus, ServiceType } from 'figtree-schemas';
import { Job } from 'node-schedule';
import { ServiceAbstract } from './ServiceAbstract.js';
export declare abstract class ServiceJobAbstract extends ServiceAbstract {
    protected _scheduler: Job | null;
    protected _lastRun: Date | null;
    protected _cron: string;
    protected _type: ServiceType;
    protected _statusScheduler: ServiceStatus;
    protected _inProcessScheduler: boolean;
    constructor(serviceName?: string, serviceDependencies?: string[]);
    isProcessScheduler(): boolean;
    getStatusScheduler(): ServiceStatus;
    protected abstract _execute(): Promise<void>;
    start(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
    reload(): Promise<void>;
    changeSchedule(cronExpression: string): Promise<void>;
    getLastRun(): Date | null;
    getCron(): string;
    static buildCron({ minute, hour, day }: {
        minute?: string | number;
        hour?: string | number;
        day?: string | number;
    }): string;
    invoke(): Promise<void>;
}
