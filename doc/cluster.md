# Cluster Support

FigTree's `BackendCluster` runs your `BackendApp` across multiple Node.js worker processes using the built-in `cluster` module. The master process forks workers, restarts them on crash, and propagates shutdown signals so each worker can drain cleanly.

## Quick start

```typescript
import { BackendCluster } from 'figtree';
import { MyBackend } from './MyBackend.js';

const cluster = new BackendCluster({
    appFactory: () => new MyBackend()
});

await cluster.start();
```

By default, the cluster forks one worker per logical CPU.

## Options

```typescript
type BackendClusterOptions = {
    /** Backend factory — called once per worker. */
    appFactory: () => BackendApp<any, any>;

    /** Number of workers. Defaults to os.cpus().length. */
    workers?: number;

    /**
     * Time to wait for workers to exit gracefully before SIGKILL (ms).
     * Should be larger than the worker's own shutdown timeout. Default 15000.
     */
    shutdownTimeoutMs?: number;

    /**
     * Signals that trigger a graceful cluster shutdown.
     * Default: ['SIGTERM', 'SIGINT'].
     */
    shutdownSignals?: NodeJS.Signals[];

    /** Respawn / circuit-breaker behavior for crashed workers. */
    respawn?: {
        /**
         * Backoff sequence in ms; index = number of recent crashes - 1.
         * The last value is reused once the index exceeds the array length.
         * Default: [0, 1000, 5000, 15000, 30000]
         * (1st crash → instant, 2nd → 1s, 3rd → 5s, ...).
         */
        backoffMs?: number[];

        /**
         * If more than maxPerWindow crashes happen within windowMs,
         * halt the cluster (process.exit(1)). Default 5.
         */
        maxPerWindow?: number;

        /** Window for the circuit breaker in ms. Default 60_000. */
        windowMs?: number;
    };
};
```

## Lifecycle

### Startup

1. The master process forks `workers` child processes.
2. Each worker calls `appFactory()` and `await app.start()`.
3. Inside the worker, `BackendApp.start()` registers an `async-exit-hook` that calls `ServiceManager.stopAll()` with a 10-second timeout when the process receives `SIGTERM` / `SIGINT` / `beforeExit`.

### Crash respawn

If a worker exits unexpectedly, the master schedules a respawn after a progressive backoff delay. This happens only **outside** of shutdown — once a shutdown signal has been received, exited workers are not replaced.

#### Backoff

The default backoff sequence is `[0, 1000, 5000, 15000, 30000]` ms — the first crash respawns instantly, the second after 1 second, the third after 5 seconds, and so on. Once the crash counter exceeds the array length, the last value is reused.

```typescript
new BackendCluster({
    appFactory: () => new MyBackend(),
    respawn: {
        backoffMs: [0, 500, 2000, 10_000]
    }
});
```

#### Circuit breaker

To prevent a tight respawn loop on persistent boot failures (misconfiguration, missing dependency, broken migration), the master tracks crashes across a rolling window. If too many happen in that window, the cluster halts:

- `respawn.windowMs` — rolling window length, default `60_000` (60 seconds).
- `respawn.maxPerWindow` — maximum crashes allowed in the window before halting, default `5`.

When the breaker trips:

```
BackendCluster: circuit breaker tripped — 6 crashes within 60000ms. Halting cluster.
```

The master sets `_shuttingDown` and calls `process.exit(1)`. A process supervisor (systemd, PM2, Kubernetes, Docker `restart: on-failure`) is expected to restart the whole cluster after that.

#### Counter window

Old crash timestamps are pruned automatically on every exit event, so a single transient crash does not accumulate forever. After a quiet period of `windowMs` the next crash is treated as the 1st again (instant respawn).

### Graceful shutdown

When the master process receives one of the configured `shutdownSignals` (default: `SIGTERM`, `SIGINT`):

1. The master sets an internal `_shuttingDown` flag — `cluster.on('exit')` no longer respawns workers.
2. The master sends `SIGTERM` to every live worker.
3. Each worker's `async-exit-hook` triggers `ServiceManager.stopAll()`, which stops services in reverse dependency order: HTTP server drains in-flight requests, DB connections close, plugins disable, etc.
4. The master collects all worker `exit` events into a `Promise.race` against `shutdownTimeoutMs`.
5. Any worker still alive after the timeout receives `SIGKILL`.
6. The master calls `process.exit(0)`.

```
                  ┌────────────────────┐
SIGTERM ────────► │ Master             │
                  │ - stop respawn     │
                  │ - SIGTERM workers  │
                  └─────────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │ Worker 1   │ │ Worker 2   │ │ Worker N   │
      │ exitHook   │ │ exitHook   │ │ exitHook   │
      │ stopAll()  │ │ stopAll()  │ │ stopAll()  │
      │ exit(0)    │ │ exit(0)    │ │ exit(0)    │
      └────────────┘ └────────────┘ └────────────┘
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                  ┌────────────────────┐
                  │ Master exits       │
                  │ (or SIGKILL after  │
                  │  shutdownTimeoutMs)│
                  └────────────────────┘
```

### Timeout sizing

Set `shutdownTimeoutMs` larger than the worker-side timeout (10s by default in `BackendApp.start()`). The worker should always be the first to terminate gracefully — the master only acts as a watchdog.

```typescript
new BackendCluster({
    appFactory: () => new MyBackend(),
    shutdownTimeoutMs: 20_000   // give workers up to 20s to drain
});
```

## Sharing state between workers

Workers do **not** share memory. To coordinate state across workers, use one of the `SharedStore` implementations.

### IPC (single host)

```typescript
import { IPCSharedStore } from 'figtree';

const store = new IPCSharedStore();
await store.init();

// from any worker
await store.set('user:42', { name: 'Alice' });
const user = await store.get<{ name: string }>('user:42');
```

The master process holds the actual `Map`; workers communicate via Node's IPC channel. Suitable for single-host clusters.

### Redis (distributed)

```typescript
import { RedisSharedStore, RedisClient } from 'figtree';

const store = new RedisSharedStore(RedisClient.getInstance(), 'myapp');
await store.init();

await store.set('user:42', { name: 'Alice' });
```

Use this when running multiple `BackendCluster` instances across multiple hosts.

## Caveats

- **Listeners and timers in `appFactory`:** the factory is called once per worker. If you create singletons or listeners outside of services, they will exist per worker — make sure that is intentional.
- **Logging:** every worker writes to its own log stream. Daily rotation is per-process; use a centralized log collector for production.
- **Singletons across workers:** anything stored in module-level variables is per-worker. Use `SharedStore` for cross-worker coordination.
- **Sticky sessions:** if you use sessions, configure your reverse proxy to send the same client to the same worker, or use a shared session store (Redis).

## Roadmap

The following improvements are planned for `BackendCluster`:

- **Worker roles** — designate workers as `http`, `cron`, `worker`, etc., propagated via `process.env.WORKER_ROLE`.
- **Leader election** — Redis-backed lease so exactly one node runs singletons (migrations, cron master).
- **Pub/Sub on `SharedStore`** — `publish` / `subscribe` for cache invalidation, config reload, plugin reinit across workers.
- **Cluster config in `ConfigBackend`** — declarative cluster setup via the config schema.