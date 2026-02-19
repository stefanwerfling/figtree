import { ServiceImportance, ServiceStatus, ServiceType } from 'figtree-schemas';
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
    getStatus(): ServiceStatus;
    getStatusMsg(): string;
    start(): Promise<void>;
    invoke(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
    reload(): Promise<void>;
}
