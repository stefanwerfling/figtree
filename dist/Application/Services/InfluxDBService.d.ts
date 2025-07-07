import { ServiceAbstract, ServiceImportance } from '../../Service/ServiceAbstract.js';
export declare class InfluxDBService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    constructor(serviceName?: string, serviceDependencies?: string[]);
    start(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
}
