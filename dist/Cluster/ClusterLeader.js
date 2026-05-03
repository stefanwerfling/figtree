import { Logger } from '../Logger/Logger.js';
export class ClusterLeader {
    static _DEFAULT_TTL_MS = 15_000;
    static _DEFAULT_RETRY_MS = 5_000;
    _lease;
    _renewMs;
    _retryMs;
    _running = false;
    _timer = null;
    _onElected = [];
    _onLost = [];
    constructor(store, options) {
        const ttlMs = options.ttlMs ?? ClusterLeader._DEFAULT_TTL_MS;
        this._lease = store.createLease(options.name, { ttlMs: ttlMs });
        this._renewMs = options.renewMs ?? Math.floor(ttlMs / 3);
        this._retryMs = options.retryMs ?? ClusterLeader._DEFAULT_RETRY_MS;
    }
    onLeaderElected(callback) {
        this._onElected.push(callback);
    }
    onLeaderLost(callback) {
        this._onLost.push(callback);
    }
    isLeader() {
        return this._lease.isHolder();
    }
    async start() {
        if (this._running) {
            return;
        }
        this._running = true;
        await this._tick();
    }
    async stop() {
        if (!this._running) {
            return;
        }
        this._running = false;
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._lease.isHolder()) {
            try {
                await this._lease.release();
            }
            catch (err) {
                Logger.getLogger().warn?.('ClusterLeader::stop: lease release failed', err);
            }
            await this._fireLost();
        }
    }
    async _tick() {
        if (!this._running) {
            return;
        }
        try {
            if (this._lease.isHolder()) {
                const renewed = await this._lease.renew();
                if (renewed) {
                    this._scheduleNext(this._renewMs);
                    return;
                }
                await this._fireLost();
                this._scheduleNext(this._retryMs);
                return;
            }
            const acquired = await this._lease.acquire();
            if (acquired) {
                await this._fireElected();
                this._scheduleNext(this._renewMs);
                return;
            }
            this._scheduleNext(this._retryMs);
        }
        catch (err) {
            Logger.getLogger().error?.('ClusterLeader::tick error', err);
            this._scheduleNext(this._retryMs);
        }
    }
    _scheduleNext(delayMs) {
        if (!this._running) {
            return;
        }
        this._timer = setTimeout(() => {
            this._tick().catch((err) => {
                Logger.getLogger().error?.('ClusterLeader::scheduled tick error', err);
            });
        }, delayMs);
    }
    async _fireElected() {
        for (const cb of this._onElected) {
            try {
                await Promise.resolve(cb());
            }
            catch (err) {
                Logger.getLogger().error?.('ClusterLeader::onLeaderElected callback error', err);
            }
        }
    }
    async _fireLost() {
        for (const cb of this._onLost) {
            try {
                await Promise.resolve(cb());
            }
            catch (err) {
                Logger.getLogger().error?.('ClusterLeader::onLeaderLost callback error', err);
            }
        }
    }
}
//# sourceMappingURL=ClusterLeader.js.map