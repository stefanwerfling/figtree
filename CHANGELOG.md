# Changelog

All notable changes to this project are documented in this file.

---

## [Unreleased] - 2026-05-03

### Added
- `BackendCluster`: Graceful shutdown — master propagates `SIGTERM`/`SIGINT` to workers, waits up to `shutdownTimeoutMs`, then `SIGKILL`s holdouts. Respawn is disabled during shutdown.
- `BackendCluster`: Crash backoff with circuit breaker — respawns are delayed by a configurable backoff sequence (default `[0, 1000, 5000, 15000, 30000]` ms); if more than `maxPerWindow` crashes (default 5) happen within `windowMs` (default 60s), the master halts the cluster with `process.exit(1)` so a supervisor (systemd, k8s) can restart it.
- `BackendCluster`: Worker roles — new `roles?: Record<string, number>` option assigns each worker a logical role (e.g. `{http: 4, cron: 1}`), propagated via `WORKER_ROLE` env. Crash respawn preserves the role.
- `BackendCluster.getWorkerId()`: Returns a stable `<hostname>:<pid>` identifier for the current process; works in single-process and clustered modes.
- `BackendCluster.getWorkerRole()`: Returns the current worker role or `'default'` when not in a role-based cluster.
- `ServiceManager.add(service, roles?)`: Optional role filter — service is silently skipped when the current `WORKER_ROLE` doesn't match. In single-process mode (no `WORKER_ROLE`), the filter is inactive.
- `BackendClusterOptions`: New `shutdownTimeoutMs`, `shutdownSignals`, `respawn`, and `roles` options.
- `BackendClusterRespawnOptions`, `BackendClusterRoles`: New exported types.
- `SharedStore`: Pub/Sub support — new abstract `publish(channel, message)`, `subscribe(channel, callback)`, `unsubscribe(channel, callback?)` methods plus exported `SharedStoreSubscriber<T>` type.
- `IPCSharedStore`: Pub/Sub via master broker — workers send publishes to the master, which fans out to all live workers and to its own local subscribers. Multiple subscribers per channel; subscriber errors are isolated (logged, do not affect siblings).
- `RedisSharedStore`: Pub/Sub via native Redis Pub/Sub — uses a lazy-created subscriber connection (Redis requires a separate connection because a subscribed connection cannot issue regular commands). Channel names are namespaced like KV keys.
- `RedisClient`: New public `subscribe(channel, callback)`, `unsubscribe(channel)`, and `duplicate()` methods. Constructor now stores its options for `duplicate()`. New `scanKeys(pattern)` and optional `ttlMs` parameter on `set()`.
- `SharedStore`: Optional `ttlMs` parameter on `set(key, value, ttlMs?)` — Redis uses native `PX`, IPC simulates via `setTimeout` in master.
- `SharedStore`: New `keys(prefix?)` method — returns all keys (optionally filtered by prefix). Redis uses `SCAN`, IPC iterates the master map and filters.
- `ClusterPublishable` interface (`src/Cluster/ClusterPublishable.ts`): Two-method interface (`getNamespace()`, `serialize()`) any class can implement to publish its state cluster-wide.
- `ClusterRegistry` class (`src/Cluster/ClusterRegistry.ts`): Heartbeat-based registry built on `SharedStore`. Each tick serializes every registered publishable and writes it to `cluster:<namespace>:<workerId>` with TTL. `queryAll<T>(namespace)` returns `Record<workerId, T>` cluster-wide. Supports singleton (`initialize`/`getInstance`) or direct instantiation.
- `tests/unit/Cluster/ClusterRegistry.test.ts`: 11 tests covering registration, querying, heartbeat, async serialize, error isolation, and singleton helpers.
- `ServiceManager`: implements `ClusterPublishable` (namespace `'service-manager'`, payload = `getInfoList()`). Exported `SERVICE_MANAGER_NAMESPACE` constant.
- `BackendApp`: auto-wires `ClusterRegistry` lifecycle — when a `ClusterRegistry` singleton was initialized in `_initServices()`, the local `ServiceManager` is registered automatically and the registry is started after services are up / stopped before services on shutdown.
- `ServiceRoute`: new `GET /v1/service/status/cluster` endpoint aggregating `ServiceInfoEntry` lists across all workers and hosts via `ClusterRegistry`. Falls back to a local-only view when no `ClusterRegistry` is configured. New optional `accessRights.clusterStatus` ACL right on `ServiceRouteACLRights` (defaults to `accessRights.status`).
- `SchemaServiceClusterStatusResponse` / `ServiceClusterStatusResponse` exported from `ServiceRoute.ts`.
- 3 additional `ServiceManager` tests for `ClusterPublishable` conformance.
- `ClusterLease` (`src/Cluster/ClusterLease.ts`): Abstract distributed-lease primitive with `acquire / renew / release / isHolder / getName`. Backed by atomic operations in the underlying `SharedStore`.
- `IPCLease` / `RedisLease`: Concrete implementations. IPC uses master-process atomic map operations; Redis uses `SET NX PX` for acquire and two tiny server-side Lua scripts (compare-and-set + compare-and-delete) for renew and release. Each lease holder has a randomly generated nonce so a stale renewal cannot overwrite another holder.
- `SharedStore`: New abstract `createLease(name, options?)` method.
- `RedisClient`: New public `setIfAbsent / compareAndSet / deleteIfEqual` methods (CAS primitives used by `RedisLease` — Lua scripts are an internal implementation detail, hidden from user code).
- `ClusterLeader` (`src/Cluster/ClusterLeader.ts`): Lifecycle abstraction on top of `ClusterLease`. `start()` / `stop()`, `isLeader()`, `onLeaderElected(cb)`, `onLeaderLost(cb)`. Internal renew/retry loop with configurable `ttlMs` (default 15s) / `renewMs` (default `ttlMs/3`) / `retryMs` (default 5s). At-most-one leader cluster-wide; failover within `ttlMs`.
- `tests/unit/Cluster/IPCLease.test.ts`: 10 tests for the IPC lease (acquire, contention, expiry, renew, release, getName).
- `tests/unit/Cluster/ClusterLeader.test.ts`: 6 tests for the leader lifecycle (election, contention, loss, takeover, idempotent start, callback error isolation).
- `bootstrap()` (`src/Application/bootstrap.ts`): One-line entry point — reads `config.json`, decides between `BackendCluster` (when `cluster.enabled === true`) or a thin single-process wrapper, then returns a `start()`-able object. In a forked worker, returns a wrapper that just runs the BackendApp; the actual config validation happens inside `BackendApp.start()`.
- `setupClusterRegistryFromConfig()` (`src/Cluster/setupClusterRegistry.ts`): Auto-wire helper — reads `cluster.sharedStore` and instantiates either `IPCSharedStore` or `RedisSharedStore`, calls `init()`, then `ClusterRegistry.initialize(store)`. Returns `{ store, registry }` or `null` when cluster is not enabled. For the Redis variant, requires an initialized `RedisClient` singleton (or pass one via `options.redisClient`).
- `ConfigBackend._loadEnvCluster()`: Maps the `CLUSTER_*` env variables (`CLUSTER_ENABLED`, `CLUSTER_WORKERS`, `CLUSTER_SHUTDOWN_TIMEOUT_MS`, `CLUSTER_SHARED_STORE_TYPE`, `CLUSTER_SHARED_STORE_NAMESPACE`) onto the `cluster` config block.
- `RedisClient.connect()`: Now idempotent — checks `_client.isOpen` first. Safe to call from multiple call sites (e.g. `RedisDBService.start()` and `RedisSharedStore.init()`) without race conditions.
- 18 new tests for `bootstrap`, `setupClusterRegistryFromConfig`, and the cluster env mapping.
- `examples/single-process/` and `examples/cluster/` — two complete, self-contained example backends moved out of `src/`. Each ships with its own `main.ts`, `config.json`, `tsconfig.json`, and `README.md`. The cluster example demonstrates `bootstrap()`, `setupClusterRegistryFromConfig()`, role-filtered services (`http` / `cron`), a sample `ServiceJobAbstract` cron job, and a `ClusterLeader`-gated cron worker for multi-host setups.
- `package.json`: new `files` field (`["dist", "README.md", "CHANGELOG.md", "LICENSE"]`) so `examples/` and other dev artifacts are excluded from the published npm package.
- Root `tsconfig.json`: explicit `exclude` for `examples`, `tests`, `dist`, `node_modules`.

### Removed
- `src/Example/` — replaced by the two self-contained packages under `examples/`.

### Fixed
- `bootstrap()`: now resolves the config file via `--config=<path>` from the CLI (parsed via `Args.get(SchemaDefaultArgs)`) and applies `CLUSTER_*` env variables on top. Previously the master only looked at `./config.json` in the current working directory, which meant `npx tsx examples/cluster/main.ts --config=examples/cluster/config.json` would silently fall through to single-process mode because the master never saw the flag. Cluster mode can now also be enabled with env vars alone (no config file required).
- 3 new tests covering the new env-override and CLI-flag pathways.
- `tests/unit/Application/BackendCluster.test.ts`, `tests/unit/Service/ServiceManager.test.ts`, `tests/unit/SharedStore/IPCSharedStore.test.ts`: Unit tests for worker identity, role helpers, the role filter, and IPC Pub/Sub behavior (21 new tests).
- `doc/cluster.md`: Comprehensive cluster guide covering startup, crash respawn (backoff + circuit breaker), graceful shutdown, worker roles, Pub/Sub, layered cluster architecture, shared state, and roadmap.
- `CLAUDE.md`: ESLint commands and lint conventions documented.

### Improved
- ESLint: Project lint count reduced from 200 errors to 0.
  - `.eslintrc.json`: Added `globals` for `NodeJS`, `BufferEncoding`, `NonSharedBuffer` (TypeScript ambient types), and `argsIgnorePattern`/`varsIgnorePattern`/`caughtErrorsIgnorePattern` (`^_`) to honor the existing `_`-prefix convention. Removed obsolete `jest` plugin reference (project uses Vitest).
  - Replaced `Function` parameter types with concrete constructor signatures in `DBLoader` and `PluginManager`.
  - `MerkleTreeRootHash.fromFolder` and `HttpRouteProviders.getProvidersRoutes`: Sequential `await` loops replaced with `Promise.all` (independent operations, order preserved).
  - Sequential `await`-in-loop patterns annotated with `eslint-disable-next-line no-await-in-loop` plus a one-line reason where parallelism is not safe (retry loops, dependency-ordered start/stop, short-circuit access checks).
- `MerkleTreeRootHash._buildMerkleRoot`: Replaced parameter reassignment with a local `level` variable.
- `Crypto/MerkleTreeRootHash`, `HttpRouteProviders`: Folder hashing and provider route loading now run in parallel.
- Various: Removed dead imports, prefixed unused parameters with `_`, added missing return types and accessibility modifiers, added `{ cause }` to wrapped errors in `ServiceManager._startService`, replaced negated conditions with `??` where applicable.

---

## [1.0.21] - 2026-04-14 (updated)

### Added (tests & docs)
- `tests/unit/Server/RouteError.test.ts`: 7 unit tests covering constructor, message format, `getStatus`, `getRawMsg`, `defaultReturn`, `asJson`
- `tests/unit/Server/RequestContext.test.ts`: 7 unit tests covering singleton lifecycle, `get`/`set` inside and outside async context, `runWithContext`
- `tests/unit/Db/Transformers.test.ts`: 33 unit tests for all four MariaDB column transformers (`ZeroPadding15`, `Bool`, `Decimal`, `Int`)
- `CLAUDE.md`: Added test commands (`npm test`, `npm run test:watch`), test directory structure, and note on `express-session` requirement in integration tests

---

## [1.0.21] - 2026-04-14

### Added
- `BruteForceProtection`: New `createBruteForceProtection(options?)` utility — configurable via `limit`, `windowMs`, `message`, usable as `parser` on any route
- `InfluxDbHelper`: Added `reset()` method to clear static connection state on service stop; properties `_connection` and `_options` are now nullable with guards in `getConnection()`, `getBucket()`, `_getWriter()`, `_getQuery()`
- `DefaultRoute`: `_defaultParser` protected property for applying middleware globally to all routes in an instance
- `DefaultRoute`: `parser` field now accepts `RequestHandler | RequestHandler[]` for middleware composition
- `HttpServer`: `_getCspDirectives()` protected method — developers can override the CSP policy per subclass
- `CLAUDE.md`: Project documentation for Claude Code

### Fixed
- `RedisClient`: `_isConnect` was never set to `true` — `connect()` returns `void`, not a boolean; removed incorrect `if` guard
- `CertificateHelper`: Now throws on unsupported key type instead of returning empty strings
- `Config`: Schema validation failures and missing schema now return `null` instead of passing through an unvalidated config
- `Logger`: Unhandled promise in `cleanLogfiles()` now caught with `.catch()`
- `DefaultRoute`: Replaced `(this._routes as any)[cMethod]()` with type-safe router calls; narrowed `method` parameter to `'get' | 'post'`
- `RequestContext`: Changed `Map<string, any>` to `Map<string, unknown>`
- `DBSaveListId` / `DBSaveListUnid`: Removed meaningless `extends any` constraints from generic type parameters

### Security
- `HttpServer`: Removed wildcard `*` from default CSP directives (`scriptSrc`, `styleSrc`, `fontSrc`)
- `HttpServer`: Rate limiter now applies only to `/json/` routes instead of globally; simplified `_limiterSkip` and `_limiterLimit`
- `BaseHttpServer`: Express error handler normalizes `any` error parameter to `Error` internally
- Example `Login` route: Demonstrates brute force protection via `parser` field

### Improved
- `BackendApp`: Added 10-second shutdown timeout via `Promise.race` to prevent hanging on exit
- `BaseHttpServer`: Replaced `fs.readFileSync` with async `fs.readFile` to avoid blocking the event loop
- `BaseHttpServer`: Documented `_getSessionStore()` override pattern for persistent session stores (e.g. Redis, PostgreSQL)
- `PluginManager`: Removed debug `console.log` from production code
- `Config`: Use `console.error` instead of `console.log` for validation errors
- `InfluxDBService`: Implemented `stop()` — calls `InfluxDbHelper.reset()` to clear connection state

### Dependencies
- Replaced deprecated peer dependency `mysql ^2.18.1` with `mysql2 ^3.0.0`

---

## [Unreleased / 1.0.21-pre] - 2026-01-20 to 2026-04-08

### Added
- `ZeroPaddingTransformer`: New MariaDB column transformer for zero-padded values
- `ServiceJobAbstract`: Abstract base class for scheduled jobs with `node-schedule` integration
- `ServiceManager`: Added `invokeService(name)` method to manually trigger a service
- `DBRepositoryBase`: New base class for DB repositories with shared CRUD logic
- `DateHelper`: New utility class with date formatting helpers
- `Config`: Added `_loadEnvFile()` method for loading `.env` files via dotenv

### Improved
- `MariaDB`: `reInit` and async support overhauled across `DBHelper`, `DBRepository`, `DBRepositoryBase`, `DBRepositoryUnid`; added setup hook for post-init logic
- `DBSaveList`: Overhauled callback signatures for `onFindAll`, `onGetId`, `onFillData` in both `DBSaveListId` and `DBSaveListUnid`
- `ServiceAbstract`: Simplified base class; moved job scheduling logic to `ServiceJobAbstract`
- `ServiceManager`: Improved dependency-aware stop order; added `ServiceRoute` update
- `ServiceRoute`: Exposed additional service status fields
- All application services (`HttpService`, `MariaDBService`, `RedisDBService`, `InfluxDBService`, `ChromaDBService`, `PluginService`): Updated to use revised `ServiceAbstract` interface
- `Session`: Updated session validation logic
- `dotenv`: Updated integration; env loading moved to `Config._loadEnvFile()`

### Fixed
- Wrong ID field name in DB entity classes
- Removed unused imports across multiple files

---

## [1.0.20] - 2025-11-19

### Added
- `ViteHttpServer`: New HTTP server variant with Vite integration for frontend development
- `SchemaRouteError`: New error class for route-level schema validation failures
- `VtsSchemaError` / `VtsSchemaValidate`: New VTS validation extensions
- Swagger UI: Support for request body documentation and multiple schemas per route
- `SwaggerUIRoute`: Added as a standalone exportable route
- `SharedStore`: New `IPCSharedStore` (inter-process) and `RedisSharedStore` (distributed) for cluster state coordination
- `BackendCluster`: New class for multi-process cluster support using Node.js `cluster` module
- `ACL` / `ACLRbac`: Role-based access control with `userRightList` support
- `ACLRight`: Access right definitions for route-level authorization
- `BoolTransformer`, `IntTransformer`, `DecimalTransformer`, `EncryptionTransformer`: New TypeORM column transformers
- `DBRepositoryBase`: Initial version with shared repository logic
- `createEntity()`: Added to `DBRepository` and `DBRepositoryUnid`
- `HttpUpload`: Chunked file upload support with progress tracking and assembly
- `HttpFileStream`: Helper class for streaming files from HTTP responses
- `PluginManager`: Full plugin system with dynamic loading, Merkle-tree hash verification, and CA validation
- `APlugin` / `APluginEvent`: Abstract base classes for plugin development
- `PluginInformation`: Plugin metadata type
- Provider system: `IProvider`, `IProviders`, `BaseProviders`, `AProviderOnLoadEvent`
- `HttpRouteProviders` / `IHttpRouteProvider`: Plugin-based HTTP route registration
- CLI tool (`figtree`): `-create-plugin-hash` flag for generating plugin Merkle hashes
- `ServiceManager`: Replaced `ServiceList`; added dependency graph, ordered start/stop, and `stopAll()`
- `ServiceRoute`: Default route exposing service status information
- `ServiceJobAbstract`: Initial version
- CSRF protection: Added `csurf` middleware to `BaseHttpServer`
- `RequestContext`: `AsyncLocalStorage`-based request context propagation
- `USHttpServer`: Unix domain socket support added to existing server

### Improved
- `DefaultRoute`: Full generic type support for headers, query, path, cookies, body, response, session; integrated ACL checks; improved error handling with `VtsSchemaError` and `RouteError`
- `DefaultRouteCheckUser`: Updated login check logic and ACL integration
- `HttpServer`: Improved rate limiter configuration
- `BaseHttpServer`: Added `_getSessionStore()` override point; improved TLS handling
- `Session`: Added `defaultInitSession()` and improved session validation
- `Config`: Updated generic config type support
- `BackendApp`: Refactored service registration; added `exitHook` for graceful shutdown
- Trust proxy configuration added to `HttpServer`
- Schemas moved to external repository `figtree-schemas`
- `vtseditor` added as external schema editor dependency

### Fixed
- Recursion bug in `DirHelper.mkdir()`
- Base HTTP server error handling corrected
- Removed TypeORM version pin that caused dependency conflicts

---

## [1.0.x] - 2025-04-15 to 2025-06-18

### Added
- `InfluxDbHelper`: InfluxDB time-series database client
- `RedisClient`: Redis cache and pub/sub client with channel subscription support
- `RedisChannel` / `RedisSubscribe`: Redis channel abstraction
- `CertificateHelper`: RSA/DSA key pair generation, self-signed certificate generation via `node-forge`
- `DBLoader` / `DBEntitiesLoader`: TypeORM entity and migration loader
- `HttpUpload`: Initial chunked upload implementation
- `BufferHelper`: Buffer utility functions
- `HttpServer`: Rate limiting, helmet security headers, session management, cookie parser, Swagger UI integration
- `BaseHttpServer`: Full HTTP/HTTPS server with TLS fallback to self-signed certificates, error handling middleware, public asset serving
- `USHttpServer`: Unix domain socket HTTP server variant
- `DefaultRoute`: Generic route class with schema validation for headers, query params, path params, cookies, body, and session
- `Logger`: Winston-based logging with daily file rotation and configurable log levels
- `Config` / `ConfigBackend`: JSON config loading with VTS schema validation and environment variable merging
- `BackendApp`: Abstract base class for backend applications with service lifecycle management
- `Args` / `Env`: Command-line argument parsing via VTS schema
- `ServiceAbstract` / `ServiceManager` (as `ServiceList`): Initial service lifecycle management
- `DirHelper` / `FileHelper`: File and directory utilities
- `PemHelper` / `PemObject`: PEM file parsing and validation
- `RawServer`: Low-level TCP socket server for custom protocols
- Example backend (`Example/`) as reference implementation
- Initial project structure, ESLint configuration, TypeScript setup

---

## [Initial] - 2024-02-07

- Initial commit