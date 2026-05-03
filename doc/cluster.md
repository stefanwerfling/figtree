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

    /**
     * Number of workers when no roles are configured. Defaults to os.cpus().length.
     * Ignored when `roles` is set.
     */
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

    /**
     * Worker roles. Each key is a role name, the value is the number of workers
     * for that role. The total worker count equals the sum of all values.
     */
    roles?: Record<string, number>;
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

## Worker roles

Workers can be assigned logical roles, propagated via the `WORKER_ROLE` env variable. Roles let you split your workload — e.g. four HTTP workers handle requests while one cron worker runs scheduled jobs.

### Configuration

```typescript
new BackendCluster({
    appFactory: () => new MyBackend(),
    roles: {
        http: 4,
        cron: 1
    }
});
```

When `roles` is set, the `workers` option is ignored. The total worker count equals the sum of all role counts (`5` in the example above). Each worker is started with `WORKER_ROLE=<role>` in its environment.

### Filtering services by role

Pass a list of allowed roles as the second argument to `ServiceManager.add()`:

```typescript
protected override async _initServices(): Promise<void> {
    // every worker runs these (no role filter)
    this._serviceManager.add(new MariaDBService());
    this._serviceManager.add(new RedisDBService());

    // only http workers
    this._serviceManager.add(new HttpService(), ['http']);

    // only the cron worker
    this._serviceManager.add(new MyReportJob(), ['cron']);

    // multi-role: http and cron both register this
    this._serviceManager.add(new HealthCheckService(), ['http', 'cron']);
}
```

The service is silently skipped when the current `WORKER_ROLE` doesn't match the filter. In single-process mode (no `BackendCluster`), the filter is inactive — every service runs. This means you can develop without thinking about roles.

### Helpers

```typescript
BackendCluster.getWorkerRole();   // 'http' | 'cron' | ... | 'default'
BackendCluster.getWorkerId();     // '<hostname>:<pid>'
```

`getWorkerRole()` returns `'default'` when `WORKER_ROLE` is not set (single-process mode or a `BackendCluster` started without roles). `getWorkerId()` always returns a `<hostname>:<pid>` string — stable across cluster and single-process modes — and is used as the unique identity in cluster-wide registries (see roadmap).

### Crash respawn preserves roles

When a worker dies, the master remembers its role and respawns a new worker with the **same** role. A cron worker stays a cron worker; an http worker stays an http worker. Without this, a crash could turn your only cron worker into another http worker.

### What is NOT shared

Each worker is its own Node.js process with its own memory. The `ServiceManager` of an http worker does not see the services of the cron worker. To see "what is running across the entire cluster", you need the cluster registry (see below).

## Cluster architecture

For features that span workers — cluster-wide service visibility, cross-host scaling, leader election — FigTree builds layered abstractions on top of `BackendCluster`. The current state and the roadmap:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 5: ServiceRoute cluster view (✓ available)        │
│          GET /v1/service/status/cluster                 │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Worker registry — ServiceManager publishes     │
│          itself (✓ available)                           │
├─────────────────────────────────────────────────────────┤
│ Layer 3.5: ClusterRegistry / ClusterPublishable         │
│            (✓ available — pattern for any class to      │
│             share its state across the cluster)         │
├─────────────────────────────────────────────────────────┤
│ Layer 3: SharedStore Pub/Sub (✓ available)              │
│          publish() / subscribe()                        │
├─────────────────────────────────────────────────────────┤
│ Layer 2: SharedStore KV + TTL (✓ available)             │
│          IPCSharedStore + RedisSharedStore              │
├─────────────────────────────────────────────────────────┤
│ Layer 1: Worker identity + roles (✓ available)          │
│          WORKER_ID, WORKER_ROLE                         │
└─────────────────────────────────────────────────────────┘
```

The layered model means: with `RedisSharedStore` configured to a single shared Redis instance, every worker on every host sees the same state. A reverse proxy distributing requests across hosts changes nothing — whichever worker handles a request can read and write the cluster-wide state.

The `ClusterRegistry` (Layer 3.5) is the generic abstraction for "this class wants to publish its state cluster-wide". Any class implementing the `ClusterPublishable` interface (a `getNamespace()` and `serialize()` pair) is automatically picked up by the registry's heartbeat and becomes queryable cluster-wide. See the [Cluster registry](#cluster-registry) section below.

## Cluster registry

`ClusterRegistry` is the generic abstraction for sharing class state cluster-wide. It builds on top of the `SharedStore` KV (TTL) and removes the boilerplate of designing key schemes, heartbeating, and cleanup yourself.

### When to use it

- A class has state you want to inspect across all workers and hosts (queue depths, cache sizes, in-flight job counters, custom service info).
- A frontend or admin endpoint needs an aggregated view (`{host1:1234: ..., host2:5678: ...}`).
- You don't want to write Redis keys / heartbeats / TTL handling yourself.

### How it works

1. Your class implements `ClusterPublishable` — two methods: `getNamespace()` (a stable string) and `serialize()` (sync or async, JSON-serializable result).
2. You register it with `ClusterRegistry`.
3. The registry runs a heartbeat (default every 10s); on each tick it calls `serialize()` on every registered item and writes the result to the underlying `SharedStore` under the key `cluster:<namespace>:<workerId>` with a TTL (default 30s, i.e. 3× heartbeat).
4. When a worker dies, its entries naturally expire from the store.
5. Any worker can query `queryAll(namespace)` and get a `Record<workerId, T>` of every live entry across the cluster.

### Setup

```typescript
import {
    ClusterRegistry,
    IPCSharedStore,        // or RedisSharedStore for multi-host
} from 'figtree';

const store = new IPCSharedStore();
await store.init();

ClusterRegistry.initialize(store, {
    heartbeatMs: 10_000,   // optional, default 10s
    ttlMs: 30_000          // optional, default 30s (must be > heartbeatMs)
});

await ClusterRegistry.getInstance().start();
```

For multi-host scaling, use `RedisSharedStore` instead of `IPCSharedStore`. Same registry API, same publishables, no other changes needed.

### A custom publishable

```typescript
import {ClusterPublishable, ClusterRegistry} from 'figtree';

class JobQueue implements ClusterPublishable {

    private _queue: Job[] = [];
    private _processed = 0;

    public getNamespace(): string {
        return 'job-queue';
    }

    public serialize(): unknown {
        return {
            depth: this._queue.length,
            processed: this._processed
        };
    }
}

const queue = new JobQueue();
ClusterRegistry.getInstance().register(queue);
```

### Querying

```typescript
type QueueInfo = { depth: number; processed: number; };

// All workers across the cluster
const all = await ClusterRegistry.getInstance().queryAll<QueueInfo>('job-queue');
// → { 'host1:1234': {depth: 5, processed: 100},
//     'host2:5678': {depth: 12, processed: 87} }

// Just this worker's own snapshot
const own = await ClusterRegistry.getInstance().queryOwn<QueueInfo>('job-queue');
// → { depth: 5, processed: 100 }  or null
```

### Lifecycle

- `start()` — begin heartbeating. Runs an immediate first tick so entries are visible without waiting one full interval.
- `stop()` — clear the timer and remove this worker's entries from the store. Call from your service shutdown or `BackendApp` exit hook.
- `unregister(item)` — stop publishing one item; immediately removes its entry from the store.

### Async serialize

`serialize()` may be async. The registry awaits it on every tick. Errors thrown (sync) or rejected (async) are logged but do not interrupt other items' ticks.

```typescript
class CacheStats implements ClusterPublishable {
    public getNamespace(): string { return 'cache-stats'; }

    public async serialize(): Promise<{ entries: number; bytes: number; }> {
        return {
            entries: await this._cache.count(),
            bytes: await this._cache.size()
        };
    }
}
```

### Caveats

- **Heartbeat cost.** Each tick serializes every registered item and does one `set` per item. Keep `serialize()` cheap; if it's expensive, increase `heartbeatMs`.
- **Eventually consistent.** Reads via `queryAll` reflect state up to the last heartbeat. A sub-second view is not the goal; for that, layer Pub/Sub on top.
- **TTL is honored only by Redis.** `IPCSharedStore` simulates TTL with `setTimeout`; that's enough for keeping the in-memory map clean. Cross-process freshness is implicit because IPC dies with the cluster.
- **Two `ClusterPublishable` instances must not share a namespace** within the same worker — the second would overwrite the first on every tick.

### Built-in: ServiceManager

`ServiceManager` implements `ClusterPublishable` out of the box (namespace `'service-manager'`, payload = `getInfoList()`). When you initialize the `ClusterRegistry` singleton in `_initServices()`, `BackendApp` automatically:

1. Registers the local `ServiceManager` with the registry.
2. Starts the registry **after** all services are up so the first heartbeat reports a meaningful state.
3. Stops the registry on shutdown **before** stopping services so this worker's entries are removed cleanly.

```typescript
protected override async _initServices(): Promise<void> {
    const store = new RedisSharedStore(redisClient, 'myapp');
    await store.init();

    ClusterRegistry.initialize(store);   // BackendApp picks this up

    this._serviceManager.add(new MariaDBService());
    this._serviceManager.add(new HttpService(), ['http']);
    this._serviceManager.add(new MyCronJob(), ['cron']);
}
```

That's all. From any worker you can now query the cluster-wide service state:

```typescript
const all = await ClusterRegistry.getInstance()
    .queryAll<ServiceInfoEntry[]>('service-manager');
// → { 'host1:1234': [...services on http worker...],
//     'host1:1235': [...services on cron worker...],
//     'host2:9876': [...services on http worker on other host...] }
```

### HTTP endpoint: cluster status

`ServiceRoute` exposes a cluster-wide aggregation endpoint:

```
GET /v1/service/status/cluster
```

Response:

```json
{
    "statusCode": "200",
    "workers": {
        "host1:1234": [ /* ServiceInfoEntry[] */ ],
        "host2:5678": [ /* ServiceInfoEntry[] */ ]
    }
}
```

If `ClusterRegistry` is not initialized, the endpoint falls back to a local-only view (the calling worker's services keyed under its own `workerId`) and returns an explanatory `msg`. This way the endpoint stays useful in single-process setups.

ACL: by default the same right as `/v1/service/status`; override with `accessRights.clusterStatus` on the `ServiceRoute` constructor if you need a different rule.

## Sharing state between workers

Workers do **not** share memory. To coordinate state across workers, use one of the `SharedStore` implementations.

### Key/value

#### IPC (single host)

```typescript
import { IPCSharedStore } from 'figtree';

const store = new IPCSharedStore();
await store.init();

// from any worker
await store.set('user:42', { name: 'Alice' });
const user = await store.get<{ name: string }>('user:42');
```

The master process holds the actual `Map`; workers communicate via Node's IPC channel. Suitable for single-host clusters.

#### Redis (distributed)

```typescript
import { RedisSharedStore, RedisClient } from 'figtree';

const store = new RedisSharedStore(RedisClient.getInstance(), 'myapp');
await store.init();

await store.set('user:42', { name: 'Alice' });
```

Use this when running multiple `BackendCluster` instances across multiple hosts.

### Pub/Sub

Both `SharedStore` implementations support fan-out messaging through `publish()` / `subscribe()`. Messages are JSON-encoded and delivered to every subscriber in the cluster — including subscribers on the same process that published the message.

```typescript
const store = new IPCSharedStore();   // or new RedisSharedStore(...)
await store.init();

await store.subscribe<{ userId: string }>('user.updated', (msg) => {
    console.log('user updated:', msg.userId);
});

// From any worker (or any host with RedisSharedStore):
await store.publish('user.updated', { userId: '42' });
```

#### How it works

- **`IPCSharedStore`**: the master is the broker. A worker that calls `publish()` sends an IPC message to the master, which fans out to every live worker (including the publisher) and to its own local subscribers. Channels live in memory; nothing is persisted.
- **`RedisSharedStore`**: uses native Redis Pub/Sub. The first `subscribe()` on a channel lazy-creates a dedicated subscriber connection (Redis requires a separate connection because a subscribed connection cannot issue regular commands). Channel names are namespaced with the same prefix as KV keys (`<namespace>:<channel>`).

#### Multiple subscribers per channel

Subscribing the same channel from multiple call sites is supported — each callback fires independently.

```typescript
await store.subscribe('cache.invalidate', refreshUserCache);
await store.subscribe('cache.invalidate', refreshOrderCache);

await store.unsubscribe('cache.invalidate', refreshUserCache);  // remove just one
await store.unsubscribe('cache.invalidate');                    // remove all
```

#### Errors

A subscriber callback that throws (sync) or rejects (async) does not affect sibling callbacks — the error is logged and the next subscriber still fires.

#### Caveats

- **Order is best-effort.** With Redis Pub/Sub there is no global ordering guarantee across workers; if you need ordering, embed a sequence number in the payload.
- **At-most-once delivery.** A subscriber that is offline when a message is published will not receive it. For durable delivery, write to a Redis stream or a database table instead.
- **No replay.** Pub/Sub does not retain history.

## Caveats

- **Listeners and timers in `appFactory`:** the factory is called once per worker. If you create singletons or listeners outside of services, they will exist per worker — make sure that is intentional.
- **Logging:** every worker writes to its own log stream. Daily rotation is per-process; use a centralized log collector for production.
- **Singletons across workers:** anything stored in module-level variables is per-worker. Use `SharedStore` for cross-worker coordination.
- **Sticky sessions:** if you use sessions, configure your reverse proxy to send the same client to the same worker, or use a shared session store (Redis).

## Roadmap

Layers 1-5 are available. The remaining items on the roadmap:

- **Leader election** — Redis-backed lease so exactly one node runs singletons (migrations, cron master) even across multiple hosts. (Today: a singleton role on a single worker via `roles: { cron: 1 }` works for single-host setups but does not survive multi-host.)
- **Cluster config in `ConfigBackend`** — declarative cluster setup (workers, roles, SharedStore choice) via the config schema.