import { ServiceInfoEntry } from 'figtree-schemas';
import { ServiceAbstract } from './ServiceAbstract.js';
export declare class ServiceManager {
    protected _services: ServiceAbstract[];
    add(service: ServiceAbstract): void;
    getByName(name: string): ServiceAbstract | null;
    getInfoList(): ServiceInfoEntry[];
    protected _startService(service: ServiceAbstract): Promise<void>;
    private _checkForCycles;
    startAll(): Promise<void>;
    stopAll(): Promise<void>;
    start(name: string): Promise<void>;
    stop(name: string): Promise<void>;
    private _stopRecursive;
    invokeService(name: string): Promise<void>;
}
