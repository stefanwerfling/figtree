# Changelog

All notable changes to this project are documented in this file.

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