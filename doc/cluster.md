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
};
```

## Lifecycle

### Startup

1. The master process forks `workers` child processes.
2. Each worker calls `appFactory()` and `await app.start()`.
3. Inside the worker, `BackendApp.start()` registers an `async-exit-hook` that calls `ServiceManager.stopAll()` with a 10-second timeout when the process receives `SIGTERM` / `SIGINT` / `beforeExit`.

### Crash respawn

If a worker exits unexpectedly, the master respawns a new one immediately. This happens only **outside** of shutdown — once a shutdown signal has been received, exited workers are not replaced.

> **Note:** the current implementation does not yet apply backoff between respawns. If a worker fails to start (e.g. a misconfiguration), it will be respawned in a tight loop. Crash backoff is on the roadmap.

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

- **Crash backoff with circuit breaker** — exponential delay between respawns; cluster halt after N crashes per minute.
- **Worker roles** — designate workers as `http`, `cron`, `worker`, etc., propagated via `process.env.WORKER_ROLE`.
- **Leader election** — Redis-backed lease so exactly one node runs singletons (migrations, cron master).
- **Pub/Sub on `SharedStore`** — `publish` / `subscribe` for cache invalidation, config reload, plugin reinit across workers.
- **Cluster config in `ConfigBackend`** — declarative cluster setup via the config schema.