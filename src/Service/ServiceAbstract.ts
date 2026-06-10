import {ServiceImportance, ServiceStatus, ServiceType} from 'figtree-schemas';

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