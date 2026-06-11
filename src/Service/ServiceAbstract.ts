import {format} from 'util';
import {ServiceImportance, ServiceLogEntry, ServiceLogLevel, ServiceStatus, ServiceType} from 'figtree-schemas';
import {Logger} from '../Logger/Logger.js';
import {ServiceLogBuffer} from './ServiceLogBuffer.js';

/**
 * Logger facade returned by {@link ServiceAbstract.getLogger}. Every
 * call writes to the shared winston logger and, when the per-service
 * buffer is enabled, also captures the formatted message there.
 */
export interface ServiceLogger {
    info(msg: unknown, ...meta: unknown[]): void;
    warn(msg: unknown, ...meta: unknown[]): void;
    error(msg: unknown, ...meta: unknown[]): void;
    debug(msg: unknown, ...meta: unknown[]): void;
}

/**
 * Snapshot of one service's log buffer, returned by
 * {@link ServiceAbstract.getServiceLog}.
 */
export interface ServiceLogSnapshot {
    active: boolean;
    maxLines: number;
    lines: ServiceLogEntry[];
}

/**
 * Service Abstract
 */
export class ServiceAbstract {

    /**
     * Service type
     * @protected
     */
    protected _type: ServiceType;

    /**
     * Importance
     */
    protected readonly _importance: ServiceImportance = ServiceImportance.Optional;

    /**
     * Service status
     * @protected
     */
    protected _status: ServiceStatus = ServiceStatus.None;

    /**
     * Service status msg
     * @protected
     */
    protected _statusMsg: string = '';

    /**
     * in process
     * @protected
     */
    protected _inProcess: boolean = false;

    /**
     * Name of service
     * @protected
     */
    protected _serviceName: string = '';

    /**
     * service dependencies
     * @protected
     */
    protected _serviceDependencies: string[] = [];

    /**
     * Wall-clock time of the most recent successful `start()`. Null
     * until the service has ever started. Re-set every time
     * {@link markStarted} runs.
     * @protected
     */
    protected _startedAt: Date | null = null;

    /**
     * Number of times the health monitor has restarted this service
     * after the initial `startAll()` pass. Stays 0 across the first
     * successful start; increments only when `markStarted()` runs on
     * an already-started service.
     * @protected
     */
    protected _restartCount: number = 0;

    /**
     * Per-service in-memory ring buffer used by the `service.getLogger`
     * facade and the `/v1/service/log/*` admin endpoints. Off by
     * default; turning it on costs nothing for callers that don't use
     * it (`push` short-circuits when `_active === false`).
     * @protected
     */
    protected _logBuffer: ServiceLogBuffer = new ServiceLogBuffer();

    /**
     * Cached logger facade. Lazy-initialized on first `getLogger()`
     * call so subclasses constructed without a name don't allocate
     * one unless they actually log.
     * @protected
     */
    protected _logger: ServiceLogger | null = null;

    /**
     * Constructor
     * @param {[string]} serviceName
     * @param {[string[]]} serviceDependencies
     */
    public constructor(serviceName?: string, serviceDependencies?: string[]) {
        this._type = ServiceType.runner;

        if (serviceName) {
            this.setServiceName(serviceName);
        } else {
            this.setServiceName(this.constructor.name);
        }

        if (serviceDependencies) {
            this.setServiceDependencies(serviceDependencies);
        }
    }

    /**
     * Return the service name
     * @return {string}
     */
    public getServiceName(): string {
        return this._serviceName;
    }

    /**
     * Set the service name
     * @param {string} name
     */
    public setServiceName(name: string): void {
        this._serviceName = name;
    }

    /**
     * Return the service dependencies
     * @return {string[]}
     */
    public getServiceDependencies(): string[] {
        return this._serviceDependencies;
    }

    /**
     * Set the service dependencies
     * @param {string[]} dependencies
     */
    public setServiceDependencies(dependencies: string[]): void {
        this._serviceDependencies = dependencies;
    }

    /**
     * Return the Service Type
     * @return {ServiceType}
     */
    public getType(): ServiceType {
        return this._type;
    }

    /**
     * Return the Service importance
     * @return {ServiceImportance}
     */
    public getImportance(): ServiceImportance {
        return this._importance;
    }

    /**
     * Return, is service in process
     * @returns {boolean}
     */
    public isProcess(): boolean {
        return this._inProcess;
    }

    /**
     * Return the service status
     * @return {ServiceStatus}
     */
    public getStatus(): ServiceStatus {
        return this._status;
    }

    /**
     * Return the Status Message
     * @return {string}
     */
    public getStatusMsg(): string {
        return this._statusMsg;
    }

    /**
     * Return when the service most recently started successfully, or
     * null if it has never started.
     * @return {Date|null}
     */
    public getStartedAt(): Date | null {
        return this._startedAt;
    }

    /**
     * Return how often the health monitor restarted this service
     * after the initial `startAll()` pass.
     * @return {number}
     */
    public getRestartCount(): number {
        return this._restartCount;
    }

    /**
     * Framework-internal: stamp `_startedAt` and bump `_restartCount`
     * after a successful `start()`. Called by `ServiceManager`. App
     * code should not call this directly — manage status by overriding
     * `start()` instead.
     */
    public markStarted(): void {
        if (this._startedAt !== null) {
            this._restartCount += 1;
        }

        this._startedAt = new Date();
    }

    /**
     * Tee logger for this service. Always writes to the shared winston
     * logger (so `LOGGING_LEVEL` and the file rotation still apply);
     * additionally captures into the per-service ring buffer when the
     * buffer is active. Use this in place of `Logger.getLogger()` for
     * any log line that belongs semantically to one service so the
     * `/v1/service/log/:name` admin route can serve it.
     *
     * @return {ServiceLogger}
     */
    public getLogger(): ServiceLogger {
        if (this._logger !== null) {
            return this._logger;
        }

        const buf = this._logBuffer;
        const winston = (): ReturnType<typeof Logger.getLogger> => Logger.getLogger();

        this._logger = {
            info: (msg: unknown, ...meta: unknown[]): void => {
                buf.push(ServiceLogLevel.info, format(msg, ...meta));
                winston().info(msg as string, ...meta);
            },
            warn: (msg: unknown, ...meta: unknown[]): void => {
                buf.push(ServiceLogLevel.warn, format(msg, ...meta));
                winston().warn(msg as string, ...meta);
            },
            error: (msg: unknown, ...meta: unknown[]): void => {
                buf.push(ServiceLogLevel.error, format(msg, ...meta));
                winston().error(msg as string, ...meta);
            },
            debug: (msg: unknown, ...meta: unknown[]): void => {
                buf.push(ServiceLogLevel.debug, format(msg, ...meta));
                winston().debug(msg as string, ...meta);
            },
        };

        return this._logger;
    }

    /**
     * Turn on per-service log capture. `maxLines` is the ring-buffer
     * size; omitting it keeps the previously configured size (or the
     * default if this is the first enable). Always starts from an
     * empty buffer.
     */
    public enableServiceLogging(maxLines?: number): void {
        this._logBuffer.enable(maxLines);
    }

    /**
     * Turn off per-service log capture and drop the captured lines.
     * Idempotent.
     */
    public disableServiceLogging(): void {
        this._logBuffer.disable();
    }

    /**
     * Snapshot of the current buffer state, suitable for direct return
     * from the `/v1/service/log/:name` route.
     */
    public getServiceLog(): ServiceLogSnapshot {
        return {
            active: this._logBuffer.isActive(),
            maxLines: this._logBuffer.getMaxLines(),
            lines: this._logBuffer.getLines(),
        };
    }

    /**
     * Probe whether the service is currently healthy. Default implementation
     * mirrors `getStatus() === Success`, so services that have no external
     * resource to probe automatically report healthy once started.
     *
     * Subclasses that own an external resource (DB connection, socket,
     * remote API) should override this to perform a cheap liveness check
     * (e.g. `SELECT 1`). Returning `false` causes `ServiceManager`'s health
     * monitor to mark the service as Error and retry `start()` on the next
     * monitor tick.
     *
     * The default uses `>=` to keep ordering-tolerant implementations
     * trivial — anything past `Success` is considered healthy.
     *
     * @return {Promise<boolean>}
     */
    public async healthCheck(): Promise<boolean> {
        return this._status === ServiceStatus.Success;
    }

    /**
     * Framework-internal: flip the service into the Error state with the
     * given reason. Called by `ServiceManager` when a periodic
     * `healthCheck()` reports the service as unhealthy. App code should
     * not call this directly — change status by overriding `start()` /
     * `stop()` instead.
     *
     * @param {string} reason
     */
    public markUnhealthy(reason: string): void {
        this._status = ServiceStatus.Error;
        this._statusMsg = reason;
    }

    /**
     * Start the service
     * @throws Error
     */
    public async start(): Promise<void> {
        // override in subclass
    }

    /**
     * Invoke a service, can call by route save.
     */
    public async invoke(): Promise<void> {
        // override in subclass
    }

    /**
     * Stop the service
     * @param {boolean} _forced
     */
    public async stop(_forced: boolean = false): Promise<void> {
        // override in subclass
    }

    /**
     * Reload the service
     */
    public async reload(): Promise<void> {
        // override in subclass
    }

}