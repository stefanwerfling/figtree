import {ServiceImportance, ServiceInfoEntry, ServiceInfoScheduler, ServiceStatus} from 'figtree-schemas';
import {ClusterPublishable} from '../Cluster/ClusterPublishable.js';
import {Logger} from '../Logger/Logger.js';
import {DateHelper} from '../Utils/DateHelper.js';
import {ServiceAbstract} from './ServiceAbstract.js';
import {ServiceJobAbstract} from './ServiceJobAbstract.js';

/**
 * Cluster registry namespace under which the ServiceManager publishes its info list.
 */
export const SERVICE_MANAGER_NAMESPACE = 'service-manager';

/**
 * Default ceiling on the synchronous "wait for deferred dependencies"
 * phase of `startAll()`. After this many milliseconds, any service whose
 * deps are still not Success is left to the health monitor.
 */
export const DEFAULT_START_ALL_TIMEOUT_MS = 30_000;

/**
 * Default monitor tick cadence — how often the manager re-evaluates
 * Important services for retry / health-check.
 */
export const DEFAULT_MONITOR_INTERVAL_MS = 5_000;

/**
 * Default per-service throttle on `healthCheck()` probes. Independent
 * of the monitor tick: probes cost real work (DB round-trip etc.) so
 * we don't run them on every tick.
 */
export const DEFAULT_HEALTH_CHECK_INTERVAL_MS = 30_000;

/**
 * ServiceManager constructor options.
 */
export type ServiceManagerOptions = {

    /**
     * Ceiling on the bounded waiting loop in `startAll()`. After this
     * many ms, services with not-yet-ready deps are left to the
     * monitor. Default: {@link DEFAULT_START_ALL_TIMEOUT_MS}.
     */
    startAllTimeoutMs?: number;

    /**
     * Monitor tick cadence in ms.
     * Default: {@link DEFAULT_MONITOR_INTERVAL_MS}.
     */
    monitorIntervalMs?: number;

    /**
     * Minimum gap between two `healthCheck()` probes of the same
     * service in ms.
     * Default: {@link DEFAULT_HEALTH_CHECK_INTERVAL_MS}.
     */
    healthCheckIntervalMs?: number;

    /**
     * If false, `startAll()` will not auto-start the monitor.
     * Useful in tests. Default: true.
     */
    autoStartMonitor?: boolean;

};

/**
 * Service Manager
 */
export class ServiceManager implements ClusterPublishable {

    /**
     * Services
     * @protected
     */
    protected _services: ServiceAbstract[] = [];

    /**
     * Ceiling on the bounded waiting loop in {@link startAll}.
     * @protected
     */
    protected readonly _startAllTimeoutMs: number;

    /**
     * Monitor tick cadence in ms.
     * @protected
     */
    protected readonly _monitorIntervalMs: number;

    /**
     * Minimum gap between two probes of the same service.
     * @protected
     */
    protected readonly _healthCheckIntervalMs: number;

    /**
     * Whether {@link startAll} kicks off the monitor when it returns.
     * @protected
     */
    protected readonly _autoStartMonitor: boolean;

    /**
     * Active monitor handle, or null when stopped.
     * @protected
     */
    protected _monitor: NodeJS.Timeout|null = null;

    /**
     * Re-entry guard for {@link _monitorTick}. A tick may take longer
     * than {@link _monitorIntervalMs} (slow healthCheck, slow start),
     * so we skip overlapping ticks.
     * @protected
     */
    protected _inTick: boolean = false;

    /**
     * Per-service timestamp (epoch ms) of the last successful
     * `healthCheck()` invocation. Used to throttle probes.
     * @protected
     */
    protected _lastHealthCheckAt: Map<string, number> = new Map();

    /**
     * Constructor
     * @param {ServiceManagerOptions} options
     */
    public constructor(options?: ServiceManagerOptions) {
        this._startAllTimeoutMs = options?.startAllTimeoutMs ?? DEFAULT_START_ALL_TIMEOUT_MS;
        this._monitorIntervalMs = options?.monitorIntervalMs ?? DEFAULT_MONITOR_INTERVAL_MS;
        this._healthCheckIntervalMs = options?.healthCheckIntervalMs ?? DEFAULT_HEALTH_CHECK_INTERVAL_MS;
        this._autoStartMonitor = options?.autoStartMonitor ?? true;
    }

    /**
     * Add a Service.
     *
     * The optional `roles` filter restricts the service to specific cluster
     * worker roles. If the current `WORKER_ROLE` env variable is set and is
     * not part of the filter, the service is silently skipped (not added).
     *
     * Behavior:
     * - `roles` undefined or empty → service runs everywhere.
     * - `roles` set, `WORKER_ROLE` set, role matches → service runs.
     * - `roles` set, `WORKER_ROLE` set, role does not match → service is skipped.
     * - `roles` set, `WORKER_ROLE` not set (single-process mode) → service runs
     *   (filter only applies inside a role-based cluster).
     *
     * @param {ServiceAbstract} service
     * @param {string[]} roles Optional cluster roles this service should run on.
     */
    public add(service: ServiceAbstract, roles?: string[]): void {
        if (roles && roles.length > 0) {
            const currentRole = process.env.WORKER_ROLE;

            if (currentRole && !roles.includes(currentRole)) {
                return;
            }
        }

        this._services.push(service);
    }

    /**
     * Return the service by name
     * @param {string} name
     * @return {ServiceAbstract|null}
     */
    public getByName(name: string): ServiceAbstract|null {
        return this._services.find(s => s.getServiceName() === name) || null;
    }

    /**
     * Return an info list by services
     * @return {ServiceInfoEntry[]}
     */
    public getInfoList(): ServiceInfoEntry[] {
        return this._services.map(service => {
            let schedulerInfo: ServiceInfoScheduler|undefined;

            if (service instanceof ServiceJobAbstract) {
                schedulerInfo = {
                    status: service.getStatusScheduler(),
                    inProcess: service.isProcessScheduler(),
                    lastRun: DateHelper.toStrOrNull(service.getLastRun()),
                    cron: service.getCron()
                };
            }

            return {
                type: service.getType(),
                name: service.getServiceName(),
                status: service.getStatus(),
                statusMsg: service.getStatusMsg(),
                importance: service.getImportance(),
                inProcess: service.isProcess(),
                dependencies: service.getServiceDependencies(),
                scheduler: schedulerInfo
            };
        });
    }

    /**
     * start the service
     * @param {ServiceAbstract} service
     * @protected
     */
    protected async _startService(service: ServiceAbstract): Promise<void> {
        const name = service.constructor.name;

        try {
            await service.start();
            Logger.getLogger().info(`Service started: ${name}`);
        } catch (error) {
            switch (service.getImportance()) {
                case ServiceImportance.Critical:
                    throw new Error(`Critical service '${name}' could not be started: ${error}`, {cause: error});

                case ServiceImportance.Important:
                    Logger.getLogger().error(`Important service '${name}' could not be started:`, error);
                    break;

                case ServiceImportance.Optional:
                    Logger.getLogger().warn(`Optional service '${name}' could not be started:`, error);
                    break;
            }
        }
    }

    /**
     * check for cycles dependencies
     * @param {ServiceAbstract} service
     * @param {Set<string>} visited
     * @param {Set<string>} stack
     * @private
     */
    private _checkForCycles(service: ServiceAbstract, visited: Set<string> = new Set(), stack: Set<string> = new Set()): void {
        const name = service.getServiceName();

        if (stack.has(name)) {
            throw new Error(`Dependency cycle detected: ${[...stack, name].join(' -> ')}`);
        }

        if (visited.has(name)) {
            return;
        }

        visited.add(name);
        stack.add(name);

        for (const depName of service.getServiceDependencies()) {
            const depService = this.getByName(depName);

            if (!depService) {
                continue;
            }

            this._checkForCycles(depService, visited, stack);
        }

        stack.delete(name);
    }

    /**
     * Are all named dependencies of `service` currently in Success state?
     * Returns false if any dep is missing from the registry.
     *
     * @param {ServiceAbstract} service
     * @return {boolean}
     * @protected
     */
    protected _areAllDepsSuccess(service: ServiceAbstract): boolean {
        for (const depName of service.getServiceDependencies()) {
            const dep = this.getByName(depName);

            if (!dep || dep.getStatus() !== ServiceStatus.Success) {
                return false;
            }
        }

        return true;
    }

    /**
     * Start all Services
     */
    public async startAll(): Promise<void> {
        // check cycles ------------------------------------------------------------------------------------------------

        for (const service of this._services) {
            this._checkForCycles(service);
        }

        // start services ----------------------------------------------------------------------------------------------

        let waitingServices: string[] = [];

        for await (const service of this._services) {
            if (service.getServiceDependencies().length === 0 || this._areAllDepsSuccess(service)) {
                await this._startService(service);
            } else {
                waitingServices.push(service.getServiceName());
            }
        }

        // Bounded waiting loop: keep trying to start deferred services as
        // their deps come up, but cap at `_startAllTimeoutMs` so a
        // permanently-failed Important dep doesn't spin startAll() forever.
        // Anything still waiting after the deadline is handed off to the
        // health monitor (see commits introducing startMonitor()).
        const deadline = Date.now() + this._startAllTimeoutMs;

        // sequential by design — poll-and-start loop respects service dependency order
        /* eslint-disable no-await-in-loop */
        while (waitingServices.length > 0 && Date.now() < deadline) {
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 500);
            });

            for (const waitService of [...waitingServices]) {
                const mService = this.getByName(waitService);

                if (mService === null) {
                    waitingServices = waitingServices.filter((s) => s !== waitService);
                    continue;
                }

                if (mService.getServiceDependencies().length === 0 || this._areAllDepsSuccess(mService)) {
                    await this._startService(mService);
                    waitingServices = waitingServices.filter((s) => s !== waitService);
                }
            }
        }
        /* eslint-enable no-await-in-loop */

        if (waitingServices.length > 0) {
            Logger.getLogger().warn(
                `ServiceManager.startAll: ${waitingServices.length} service(s) still waiting after ` +
                `${this._startAllTimeoutMs}ms [${waitingServices.join(', ')}]. ` +
                'Health monitor will retry once their dependencies become healthy.'
            );
        }

        if (this._autoStartMonitor) {
            this.startMonitor();
        }
    }

    /**
     * Stop all Services
     */
    public async stopAll(): Promise<void> {
        this.stopMonitor();

        const services = [...this._services].reverse();

        for await (const service of services) {
            try {
                await this._stopRecursive(service.getServiceName());

                Logger.getLogger().info(`Service stopped: ${service.constructor.name}`);
            } catch (error) {
                Logger.getLogger().warn(`Error stopping '${service.constructor.name}':`, error);
            }
        }
    }

    /**
     * Start the periodic health monitor. The monitor runs every
     * {@link _monitorIntervalMs} ms and:
     *
     * - Retries `start()` on Important services that are currently in
     *   `Error` or `None` state and whose dependencies are now ready.
     * - Probes Important services in `Success` state via
     *   `service.healthCheck()`, throttled per service by
     *   {@link _healthCheckIntervalMs}. A `false` result flips the
     *   service to `Error`, which makes the next monitor tick attempt
     *   to restart it.
     *
     * Optional services are never monitored — one-shot best-effort at
     * startup is the contract.
     *
     * Re-entrant calls are no-ops. The interval handle is unref'd so
     * it never holds the process open on its own.
     */
    public startMonitor(): void {
        if (this._monitor !== null) {
            return;
        }

        this._monitor = setInterval(() => {
            this._monitorTick().catch((error) => {
                Logger.getLogger().error('ServiceManager: monitor tick threw uncaught:', error);
            });
        }, this._monitorIntervalMs);

        // Don't pin the event loop open for the sake of the monitor —
        // shutdown should still happen even if stopMonitor isn't called.
        this._monitor.unref();
    }

    /**
     * Stop the periodic health monitor. Idempotent.
     */
    public stopMonitor(): void {
        if (this._monitor !== null) {
            clearInterval(this._monitor);
            this._monitor = null;
        }
    }

    /**
     * Run a single monitor tick. Public for tests; production code
     * should rely on the interval set up by {@link startMonitor}.
     */
    public async runMonitorTick(): Promise<void> {
        await this._monitorTick();
    }

    /**
     * One monitor pass. Iterates every Important service exactly once,
     * picking the appropriate action (retry / probe / defer-start)
     * based on the current status. Guarded against re-entry so a slow
     * tick doesn't overlap with the next interval firing.
     *
     * @protected
     */
    protected async _monitorTick(): Promise<void> {
        if (this._inTick) {
            return;
        }

        this._inTick = true;

        try {
            // sequential by design — health probes and retries on shared
            // resources (DB pool) should not overlap inside a tick
            /* eslint-disable no-await-in-loop */
            for (const service of this._services) {
                if (service.isProcess()) {
                    continue;
                }

                if (service.getImportance() !== ServiceImportance.Important) {
                    continue;
                }

                const status = service.getStatus();

                if (status === ServiceStatus.Error || status === ServiceStatus.None) {
                    if (this._areAllDepsSuccess(service)) {
                        await this._startService(service);
                    }

                    continue;
                }

                if (status === ServiceStatus.Success) {
                    const name = service.getServiceName();
                    const last = this._lastHealthCheckAt.get(name) ?? 0;

                    if (Date.now() - last < this._healthCheckIntervalMs) {
                        continue;
                    }

                    this._lastHealthCheckAt.set(name, Date.now());

                    let ok = false;

                    try {
                        ok = await service.healthCheck();
                    } catch (error) {
                        Logger.getLogger().warn(
                            `ServiceManager: healthCheck threw for '${name}', treating as unhealthy:`,
                            error
                        );
                        ok = false;
                    }

                    if (!ok) {
                        Logger.getLogger().warn(`ServiceManager: '${name}' became unhealthy`);
                        service.markUnhealthy('healthCheck reported unhealthy');
                    }
                }
            }
            /* eslint-enable no-await-in-loop */
        } finally {
            this._inTick = false;
        }
    }

    /**
     * Start a service by name
     * @param {string} name
     * @throws {Error}
     */
    public async start(name: string): Promise<void> {
        const service = this.getByName(name);

        // -------------------------------------------------------------------------------------------------------------

        if (service === null) {
            throw new Error(`Service not found by name: ${name}`);
        }

        if (service.getStatus() === ServiceStatus.Success) {
            return;
        }

        if (service.isProcess()) {
            throw new Error(`Service already in processing: ${name}`);
        }

        const deps = service.getServiceDependencies();

        for (const dep of deps) {
            const depService = this.getByName(dep);

            if (depService === null) {
                throw new Error(`Dependencie-Service not found by name: ${dep}`);
            }

            if (depService.getStatus() !== ServiceStatus.Success) {
                throw new Error(`Dependencie-Service is not ready by name: ${dep}`);
            }
        }

        // -------------------------------------------------------------------------------------------------------------

        await this._startService(service);
    }

    /**
     * Stop a service by name
     * @param {string} name
     */
    public async stop(name: string): Promise<void> {
        await this._stopRecursive(name);
    }

    /**
     * stop service with dependency
     * @param {string} name
     * @param {Set<string>} visited
     * @private
     */
    private async _stopRecursive(name: string, visited: Set<string> = new Set()): Promise<void> {
        if (visited.has(name)) {
            throw new Error(`Circular dependency detected while stopping: ${name}`);
        }

        visited.add(name);

        const dependents = this._services.filter(s => s.getServiceDependencies().includes(name));

        for (const dependent of dependents) {
            if (dependent.getStatus() === ServiceStatus.Success) {
                // sequential by design — recursive stop respects dependency order
                // eslint-disable-next-line no-await-in-loop
                await this._stopRecursive(dependent.getServiceName(), visited);
            }
        }

        const service = this.getByName(name);

        if (service && service.getStatus() === ServiceStatus.Success) {
            await service.stop();

            Logger.getLogger().info(`Service stopped: ${service.getServiceName()}`);
        } else {
            if (service === null) {
                throw new Error(`Service not found by name: ${name}`);
            }

            if (service.getStatus() !== ServiceStatus.Success) {
                throw new Error(`The service has not successfully started to stop: ${name}`);
            }
        }
    }

    // -- ClusterPublishable -------------------------------------------------------------------------------------------

    /**
     * Cluster-wide namespace under which the ServiceManager publishes its state.
     * @return {string}
     */
    public getNamespace(): string {
        return SERVICE_MANAGER_NAMESPACE;
    }

    /**
     * Serialized snapshot of this manager — same shape as `getInfoList()`.
     * Used by `ClusterRegistry` to publish the manager's state cluster-wide.
     * @return {ServiceInfoEntry[]}
     */
    public serialize(): ServiceInfoEntry[] {
        return this.getInfoList();
    }

    // -----------------------------------------------------------------------------------------------------------------

    /**
     * invoke a service by name
     * @param {string} name
     */
    public async invokeService(name: string): Promise<void> {
        const service = this.getByName(name);

        if (!service) {
            throw new Error(`Service not found: ${name}`);
        }

        if (service.isProcess()) {
            Logger.getLogger().warn(`Service ${name} is already running`);
            return;
        }

        await service.invoke();
        Logger.getLogger().info(`Service ${name} invoked manually`);
    }

}