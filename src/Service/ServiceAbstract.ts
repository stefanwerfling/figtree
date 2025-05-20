/**
 * Service Type
 */
export enum ServiceType {
    runner,
    scheduler
}

/**
 * Service Status
 */
export enum ServiceStatus {
    None = 'none',
    Progress = 'progress',
    Success = 'success',
    Error = 'error'
}

/**
 * Service Importance
 */
export enum ServiceImportance {
    Optional,
    Important,
    Critical
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
     * @return {string|ServiceStatus}
     */
    public getStatus(): string|ServiceStatus {
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
     * Start the service
     * @throws Error
     */
    public async start(): Promise<void> {}

    /**
     * Invoke a service, can call by route save.
     */
    public async invoke(): Promise<void> {}

    /**
     * Stop the service
     * @param {boolean} forced
     */
    public async stop(forced: boolean = false): Promise<void> {}

    /**
     * Reload the service
     */
    public async reload(): Promise<void> {}

}