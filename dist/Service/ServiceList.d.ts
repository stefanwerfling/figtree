import { ServiceAbstract } from './ServiceAbstract.js';
export declare class ServiceList {
    protected _services: ServiceAbstract[];
    add(service: ServiceAbstract): void;
    getByName(name: string): ServiceAbstract | null;
    protected _startService(service: ServiceAbstract): Promise<void>;
    startAll(): Promise<void>;
    stopAll(): Promise<void>;
}
