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
 * Service Abstract
 */
export class ServiceAbstract {

    /**
     * Service type
     * @protected
     */
    protected _type: ServiceType;

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
     * Constructor
     */
    public constructor() {
        this._type = ServiceType.runner;
    }

    /**
     * Return the Service Type
     * @return {ServiceType}
     */
    public getType(): ServiceType {
        return this._type;
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