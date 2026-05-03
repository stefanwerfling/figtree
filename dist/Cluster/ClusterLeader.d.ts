import { SharedStore } from '../SharedStore/SharedStore.js';
export type ClusterLeaderCallback = () => void | Promise<void>;
export type ClusterLeaderOptions = {
    name: string;
    ttlMs?: number;
    renewMs?: number;
    retryMs?: number;
};
export declare class ClusterLeader {
    private static readonly _DEFAULT_TTL_MS;
    private static readonly _DEFAULT_RETRY_MS;
    private readonly _lease;
    private readonly _renewMs;
    private readonly _retryMs;
    private _running;
    private _timer;
    private readonly _onElected;
    private readonly _onLost;
    constructor(store: SharedStore, options: ClusterLeaderOptions);
    onLeaderElected(callback: ClusterLeaderCallback): void;
    onLeaderLost(callback: ClusterLeaderCallback): void;
    isLeader(): boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
    private _tick;
    private _scheduleNext;
    private _fireElected;
    private _fireLost;
}
