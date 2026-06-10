# Service Lifecycle & Health Monitoring

FigTree's `ServiceManager` coordinates a set of `ServiceAbstract` instances through three phases: **startup**, **runtime** (with health monitoring), and **shutdown**. This page covers how each phase behaves, what hooks a service can override, and how to model an external resource (DB, socket, remote API) so that brief outages recover automatically.

## Status model

Every `ServiceAbstract` exposes a `ServiceStatus` (from `figtree-schemas`):

| Status     | Meaning                                                         |
| ---------- | --------------------------------------------------------------- |
| `None`     | Untouched. Either never attempted, or stopped by the framework. |
| `Progress` | `start()` (or `stop()`) is currently in flight.                 |
| `Success`  | Last `start()` completed and the service is considered healthy. |
| `Error`    | Last `start()` threw, or a periodic health probe failed.        |

Status is paired with `_importance`:

| Importance  | What happens when `start()` throws                                                          |
| ----------- | ------------------------------------------------------------------------------------------- |
| `Critical`  | `startAll()` aborts the whole process. Wrap in your own try/catch only if you know better.  |
| `Important` | Logged as `error`. Monitor will keep retrying until it succeeds.                            |
| `Optional`  | Logged as `warn`. **One-shot best-effort** — monitor never touches optional services again. |

## Startup

`startAll()` runs in two phases:

1. **Initial pass.** Iterates registered services in declaration order. Cycles are rejected up-front. For each service, if all named dependencies are already in `Success`, the service is started inline. Otherwise it is deferred.

2. **Bounded waiting loop.** Polls deferred services every 500 ms. As soon as a deferred service's deps reach `Success`, it is started. The loop is **bounded** by `startAllTimeoutMs` (default 30 s) — if a dependency never comes up in that window, the deferred services are handed off to the health monitor and `startAll()` returns. A warning is logged.

After the bounded loop, `startAll()` invokes `startMonitor()` (unless `autoStartMonitor: false` was passed at construction).

> **Why bounded?** The previous design polled forever. A service whose `start()` failed once was never retried, so every dependent would block in the wait queue indefinitely. The bounded loop hands the recovery work to the monitor, which is the right abstraction for "this might come back later."

## Runtime — the health monitor

`startMonitor()` schedules an interval (default 5 s) that runs `_monitorTick()`. Each tick walks the registered services exactly once and picks one of three actions per service, based on importance and status:

```
for service in services:
    skip if isProcess()                          ← in-flight start/stop, don't re-enter
    skip if importance !== Important             ← Optional + Critical don't participate

    if status in (Error, None) and deps ready:
        await _startService(service)             ← retry path

    if status === Success:
        if Date.now() - lastProbeAt >= healthCheckIntervalMs:
            ok = await service.healthCheck()      ← throws are caught + treated as false
            if not ok:
                service.markUnhealthy(reason)    ← Success → Error
```

Probes are throttled per-service by `healthCheckIntervalMs` (default 30 s), independent of the monitor cadence. So even at a 5 s tick, a single DB doesn't see more than one `SELECT 1` per 30 s.

The tick is re-entry guarded — a probe or retry that takes longer than the interval does not stack.

### Recovery scenario walked through

> Backend is running. MariaDB host has a backup job that briefly holds the connection. The TypeORM pool throws. The next time anything queries the DB, `DBHelper.ensureInitialized` retries 5×3 s — but if the outage outlasts that, the DataSource stays broken.

What the monitor does, with default cadences:

1. **Tick at +30 s.** `MariaDBService` is in `Success`, throttle hits. `healthCheck()` runs `SELECT 1`. Connection is dead → returns `false`. Monitor flips status to `Error`.
2. **Tick at +35 s.** `MariaDBService` is in `Error`, no deps to worry about. Monitor calls `_startService(mariadb)`, which calls `MariaDBService.start()`, which calls `DBHelper.init()`, which builds a fresh `DataSource` and tries to connect. If MariaDB is back: `Success`. If not: `Error`, retry next tick.
3. **Tick at +40 s.** Any cron service that depends on `mariadb` and is in `Error` because of an earlier failed start: monitor sees its deps are now `Success`, calls `_startService(cronService)`, scheduler is registered.

Total worst-case recovery from "backend doesn't know DB is back" to "schedulers running again" with defaults: ≈ `healthCheckIntervalMs + 2 * monitorIntervalMs` ≈ 40 s.

## Shutdown

`stopAll()`:

1. Calls `stopMonitor()` first so the monitor can't race against the shutdown.
2. Walks services in reverse registration order, stopping each via `_stopRecursive`. Dependents are stopped before their deps.

`stopMonitor()` is idempotent. Calling it manually is safe (and a sensible pattern in tests).

## Writing a service that participates in health monitoring

The minimal contract for a service that owns an external resource:

```typescript
import {ServiceImportance, ServiceStatus} from 'figtree-schemas';
import {ServiceAbstract} from 'figtree';

export class MyRemoteService extends ServiceAbstract {

    public static NAME = 'myremote';

    protected readonly _importance: ServiceImportance = ServiceImportance.Important;

    public override async start(): Promise<void> {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;

        try {
            await this._client.connect();
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;
            throw error;
        }

        this._status = ServiceStatus.Success;
        this._inProcess = false;
    }

    public override async stop(): Promise<void> {
        await this._client.disconnect();
        this._status = ServiceStatus.None;
        this._inProcess = false;
    }

    public override async healthCheck(): Promise<boolean> {
        try {
            await this._client.ping();
            return true;
        } catch {
            return false;
        }
    }

}
```

**Rules of thumb:**

- **`start()` must be idempotent.** The monitor will retry it after a failure. If your first attempt partially set up state, clean up before throwing — or design `start()` to be safely re-entrant.
- **`healthCheck()` must be cheap.** Probed every `healthCheckIntervalMs`. A `SELECT 1` or a `ping` is fine; anything that does real work is not.
- **`healthCheck()` should be self-contained.** Don't depend on the monitor having flipped status yet — return `false` purely based on the live probe result.
- **Throwing inside `healthCheck()` is fine.** The monitor catches and treats it as `false`.
- **Don't override `markUnhealthy()`** unless you have a very specific reason. It's the framework's hook for status transitions.

## Configuration

`ServiceManager`'s constructor accepts these tunables:

| Option                  | Default | Purpose                                                                     |
| ----------------------- | ------- | --------------------------------------------------------------------------- |
| `startAllTimeoutMs`     | 30 000  | Ceiling on the bounded waiting loop in `startAll()`.                        |
| `monitorIntervalMs`     | 5 000   | Cadence of the monitor tick.                                                |
| `healthCheckIntervalMs` | 30 000  | Minimum gap between two `healthCheck()` probes of the same service.         |
| `autoStartMonitor`      | `true`  | If `false`, `startAll()` won't kick off the monitor. Useful in tests.       |

For deterministic tests, `ServiceManager` exposes `runMonitorTick()` so you can drive the monitor synchronously without waiting for the interval.

## Comparison with the old behaviour

Before this contract was in place:

- The waiting loop in `startAll()` polled forever. A dep stuck in `Error` blocked dependents permanently.
- No periodic probe. A `Success` service stayed `Success` even after its external resource died — calling code only noticed on the next live query.
- No retry of failed Important services. Once `start()` threw, that service was effectively dead for the lifetime of the process.

After:

- Bounded `startAll()` exits within `startAllTimeoutMs` regardless of dep state.
- Periodic probes catch external-resource outages mid-run.
- Monitor retries failed Important services indefinitely; their dependents follow as soon as they go `Success`.
