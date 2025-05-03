import { ServiceAbstract, ServiceImportance } from '../../Service/ServiceAbstract.js';
export declare class InfluxDBService extends ServiceAbstract {
    protected readonly _importance: ServiceImportance;
    start(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
}
