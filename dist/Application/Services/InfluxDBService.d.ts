import { ServiceImportance } from 'figtree-schemas';
import { ServiceAbstract } from '../../Service/ServiceAbstract.js';
export declare class InfluxDBService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    constructor(serviceName?: string, serviceDependencies?: string[]);
    start(): Promise<void>;
    stop(): Promise<void>;
}
