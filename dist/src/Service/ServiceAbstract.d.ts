export declare enum ServiceType {
    runner = 0,
    scheduler = 1
}
export declare enum ServiceStatus {
    None = "none",
    Progress = "progress",
    Success = "success",
    Error = "error"
}
export declare class ServiceAbstract {
    protected _type: ServiceType;
    protected _status: ServiceStatus;
    protected _statusMsg: string;
    protected _inProcess: boolean;
    constructor();
    getType(): ServiceType;
    isProcess(): boolean;
    getStatus(): string | ServiceStatus;
    getStatusMsg(): string;
    start(): Promise<void>;
    invoke(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
    reload(): Promise<void>;
}
