export type ClusterLeaseOptions = {
    ttlMs?: number;
};
export declare abstract class ClusterLease {
    abstract acquire(): Promise<boolean>;
    abstract renew(): Promise<boolean>;
    abstract release(): Promise<boolean>;
    abstract isHolder(): boolean;
    abstract getName(): string;
}
