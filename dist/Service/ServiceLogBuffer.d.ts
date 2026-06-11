import { ServiceLogEntry, ServiceLogLevel } from 'figtree-schemas';
export declare const DEFAULT_SERVICE_LOG_BUFFER_LINES = 50;
export declare const MIN_SERVICE_LOG_BUFFER_LINES = 1;
export declare class ServiceLogBuffer {
    protected _active: boolean;
    protected _maxLines: number;
    protected _lines: ServiceLogEntry[];
    constructor(maxLines?: number);
    isActive(): boolean;
    getMaxLines(): number;
    getLines(): ServiceLogEntry[];
    enable(maxLines?: number): void;
    disable(): void;
    push(level: ServiceLogLevel, msg: string): void;
    protected static _clamp(value: number): number;
}
