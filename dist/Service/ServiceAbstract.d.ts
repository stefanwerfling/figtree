import { ServiceImportance, ServiceLogEntry, ServiceStatus, ServiceType } from 'figtree-schemas';
import { ServiceLogBuffer } from './ServiceLogBuffer.js';
export interface ServiceLogger {
    info(msg: unknown, ...meta: unknown[]): void;
    warn(msg: unknown, ...meta: unknown[]): void;
    error(msg: unknown, ...meta: unknown[]): void;
    debug(msg: unknown, ...meta: unknown[]): void;
}
export interface ServiceLogSnapshot {
    active: boolean;
    maxLines: number;
    lines: ServiceLogEntry[];
}
export declare class ServiceAbstract {
    protected _type: ServiceType;
    protected readonly _importance: ServiceImportance;
    protected _status: ServiceStatus;
    protected _statusMsg: string;
    protected _inProcess: boolean;
    protected _serviceName: string;
    protected _serviceDependencies: string[];
    protected _startedAt: Date | null;
    protected _restartCount: number;
    protected _logBuffer: ServiceLogBuffer;
    protected _logger: ServiceLogger | null;
    constructor(serviceName?: string, serviceDependencies?: string[]);
    getServiceName(): string;
    setServiceName(name: string): void;
    getServiceDependencies(): string[];
    setServiceDependencies(dependencies: string[]): void;
    getType(): ServiceType;
    getImportance(): ServiceImportance;
    isProcess(): boolean;
    getStatus(): ServiceStatus;
    getStatusMsg(): string;
    getStartedAt(): Date | null;
    getRestartCount(): number;
    markStarted(): void;
    getLogger(): ServiceLogger;
    enableServiceLogging(maxLines?: number): void;
    disableServiceLogging(): void;
    getServiceLog(): ServiceLogSnapshot;
    healthCheck(): Promise<boolean>;
    markUnhealthy(reason: string): void;
    start(): Promise<void>;
    invoke(): Promise<void>;
    stop(_forced?: boolean): Promise<void>;
    reload(): Promise<void>;
}
