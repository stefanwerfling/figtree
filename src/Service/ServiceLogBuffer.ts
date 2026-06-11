import {ServiceLogEntry, ServiceLogLevel} from 'figtree-schemas';

/**
 * Default ring-buffer size — chosen to be just enough for a handful of
 * recent cron ticks plus their setup/teardown logging without the JSON
 * payload getting unwieldy on the `GET /v1/service/log/:name` route.
 */
export const DEFAULT_SERVICE_LOG_BUFFER_LINES = 50;

/**
 * Lower bound on the ring-buffer size. Anything below 1 would make
 * `push` a no-op even when capture is on, which is surprising; clamp
 * instead of throwing because the operator's intent is clear (capture
 * something, even if tiny).
 */
export const MIN_SERVICE_LOG_BUFFER_LINES = 1;

/**
 * Per-service in-memory ring buffer for log lines. Owned by
 * {@link ServiceAbstract}; the matching `service.getLogger()` facade
 * tees writes here when `_active === true`. When inactive, `push()` is
 * a guarded no-op so the facade carries zero overhead in steady state.
 *
 * The buffer is not persisted — it lives in the worker process and is
 * lost on restart, by design. Operators turn capture on via the admin
 * route only when they're actively debugging a service.
 */
export class ServiceLogBuffer {

    protected _active: boolean = false;

    protected _maxLines: number;

    protected _lines: ServiceLogEntry[] = [];

    public constructor(maxLines: number = DEFAULT_SERVICE_LOG_BUFFER_LINES) {
        this._maxLines = ServiceLogBuffer._clamp(maxLines);
    }

    public isActive(): boolean {
        return this._active;
    }

    public getMaxLines(): number {
        return this._maxLines;
    }

    /**
     * Snapshot of the captured lines in chronological order. Returns a
     * shallow copy so the caller can't mutate the internal buffer.
     */
    public getLines(): ServiceLogEntry[] {
        return [...this._lines];
    }

    /**
     * Turn capture on. Optionally resize the ring buffer; the new
     * `maxLines` is clamped to {@link MIN_SERVICE_LOG_BUFFER_LINES} or
     * higher. Always starts from an empty buffer so an operator
     * doesn't see stale lines from a previous capture session.
     */
    public enable(maxLines?: number): void {
        if (typeof maxLines === 'number' && Number.isFinite(maxLines)) {
            this._maxLines = ServiceLogBuffer._clamp(maxLines);
        }

        this._active = true;
        this._lines = [];
    }

    /**
     * Turn capture off and drop the buffer contents. Idempotent.
     */
    public disable(): void {
        this._active = false;
        this._lines = [];
    }

    /**
     * Append one line. No-op when capture is off — this is the hot
     * path for the logger facade, so the early-return matters.
     */
    public push(level: ServiceLogLevel, msg: string): void {
        if (!this._active) {
            return;
        }

        this._lines.push({
            ts: new Date().toISOString(),
            level: level,
            msg: msg,
        });

        while (this._lines.length > this._maxLines) {
            this._lines.shift();
        }
    }

    protected static _clamp(value: number): number {
        const floored = Math.floor(value);
        return floored < MIN_SERVICE_LOG_BUFFER_LINES ? MIN_SERVICE_LOG_BUFFER_LINES : floored;
    }

}