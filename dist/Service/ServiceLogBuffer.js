export const DEFAULT_SERVICE_LOG_BUFFER_LINES = 50;
export const MIN_SERVICE_LOG_BUFFER_LINES = 1;
export class ServiceLogBuffer {
    _active = false;
    _maxLines;
    _lines = [];
    constructor(maxLines = DEFAULT_SERVICE_LOG_BUFFER_LINES) {
        this._maxLines = ServiceLogBuffer._clamp(maxLines);
    }
    isActive() {
        return this._active;
    }
    getMaxLines() {
        return this._maxLines;
    }
    getLines() {
        return [...this._lines];
    }
    enable(maxLines) {
        if (typeof maxLines === 'number' && Number.isFinite(maxLines)) {
            this._maxLines = ServiceLogBuffer._clamp(maxLines);
        }
        this._active = true;
        this._lines = [];
    }
    disable() {
        this._active = false;
        this._lines = [];
    }
    push(level, msg) {
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
    static _clamp(value) {
        const floored = Math.floor(value);
        return floored < MIN_SERVICE_LOG_BUFFER_LINES ? MIN_SERVICE_LOG_BUFFER_LINES : floored;
    }
}
//# sourceMappingURL=ServiceLogBuffer.js.map