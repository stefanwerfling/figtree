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
export declare enum ServiceImportance {
    Optional = 0,
    Important = 1,
    Critical = 2
}
export declare class ServiceAbstract {
    protected _type: ServiceType;
    protected readonly _importance: ServiceImportance;
    protected _status: ServiceStatus;
    protected _statusMsg: string;
    protected _inProcess: boolean;
    protected _serviceName: string;
    protected _serviceDependencies: string[];
    constructor(serviceName?: string, serviceDependencies?: string[]);
    getServiceName(): string;
    setServiceName(name: string): void;
    getServiceDependencies(): string[];
    setServiceDependencies(dependencies: string[]): void;
    getType(): ServiceType;
    getImportance(): ServiceImportance;
    isProcess(): boolean;
    getStatus(): string | ServiceStatus;
    getStatusMsg(): string;
    start(): Promise<void>;
    invoke(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
    reload(): Promise<void>;
}
