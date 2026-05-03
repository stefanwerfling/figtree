import { ServiceInfoEntry } from 'figtree-schemas';
import { ClusterPublishable } from '../Cluster/ClusterPublishable.js';
import { ServiceAbstract } from './ServiceAbstract.js';
export declare const SERVICE_MANAGER_NAMESPACE = "service-manager";
export declare class ServiceManager implements ClusterPublishable {
    protected _services: ServiceAbstract[];
    add(service: ServiceAbstract, roles?: string[]): void;
    getByName(name: string): ServiceAbstract | null;
    getInfoList(): ServiceInfoEntry[];
    protected _startService(service: ServiceAbstract): Promise<void>;
    private _checkForCycles;
    startAll(): Promise<void>;
    stopAll(): Promise<void>;
    start(name: string): Promise<void>;
    stop(name: string): Promise<void>;
    private _stopRecursive;
    getNamespace(): string;
    serialize(): ServiceInfoEntry[];
    invokeService(name: string): Promise<void>;
}
