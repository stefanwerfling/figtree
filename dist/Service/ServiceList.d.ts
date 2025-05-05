import { ServiceAbstract } from './ServiceAbstract.js';
export declare class ServiceList {
    protected _services: ServiceAbstract[];
    add(service: ServiceAbstract): void;
    startAll(): Promise<void>;
    stopAll(): Promise<void>;
}
