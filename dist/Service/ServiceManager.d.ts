import { ServiceInfoEntry } from 'figtree_schemas';
import { ServiceAbstract } from './ServiceAbstract.js';
export declare class ServiceManager {
    protected _services: ServiceAbstract[];
    add(service: ServiceAbstract): void;
    getByName(name: string): ServiceAbstract | null;
    getInfoList(): ServiceInfoEntry[];
    protected _startService(service: ServiceAbstract): Promise<void>;
    startAll(): Promise<void>;
    stopAll(): Promise<void>;
    start(name: string): Promise<void>;
    stop(name: string): Promise<void>;
}
