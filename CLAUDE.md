# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # Clean dist + full TypeScript compile (rm -rf dist && tsc)
npm run compile      # Incremental TypeScript compile (tsc --project tsconfig.json)
npm run clean        # Remove dist directory
npm test             # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode

# Lint (ESLint v9 + legacy .eslintrc.json — flag ESLINT_USE_FLAT_CONFIG=false required)
ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/**/*.ts' 'tests/**/*.ts'
ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/**/*.ts' 'tests/**/*.ts' --fix
```

TypeScript strict mode is enabled — `npm run compile` is the primary correctness check.

The CLI binary is exposed after build at `./dist/Cli/index.js` (registered as `figtree` in package.json `bin`).

## Lint conventions

- ESLint config is `.eslintrc.json` (legacy format under ESLint v9 — pass `ESLINT_USE_FLAT_CONFIG=false`).
- Unused parameters / vars / caught errors must be prefixed with `_` (configured via `argsIgnorePattern: "^_"` etc.).
- TypeScript ambient types (`NodeJS.*`, `BufferEncoding`, `NonSharedBuffer`) are listed under `globals` rather than disabling `no-undef`.
- `no-await-in-loop` is enforced; for genuinely sequential loops (retry with backoff, dependency-ordered start/stop, short-circuit checks) use `// eslint-disable-next-line no-await-in-loop` with a one-line reason.

## Tests

Tests use **Vitest** (ESM-compatible) and **supertest** for HTTP integration tests.

```
tests/
  unit/
    Config/          # Config.load() — file-based tests using /tmp
    Crypto/          # CertificateHelper RSA keygen
    Server/          # BruteForceProtection factory
    Utils/           # StringHelper, IPHelper, DateHelper, BufferHelper
  integration/
    Routes/          # DefaultRoute + BruteForceProtection via supertest
```

- Unit tests run without a database or network.
- Integration route tests spin up a minimal Express app in `beforeAll` with `express-session` middleware — required because `DefaultRoute` accesses `req.session.id` in its catch block.
- To run a single test file: `npx vitest run tests/unit/Utils/StringHelper.test.ts`

## Architecture

FigTree is a TypeScript backend framework published as an npm package. All source lives in `src/`, compiled to `dist/` with declaration files. Module system is NodeNext (`"module": "NodeNext"` in tsconfig), so imports must use explicit `.js` extensions even for `.ts` source files.

### Layer overview

**Entry point for consumers:** Extend `BackendApp<Args, Config>` (`src/Application/BackendApp.ts`), register services, call `await backend.start()`. Clustering is supported via `BackendCluster`.

**Service lifecycle** (`src/Service/`): All major subsystems are `ServiceAbstract` subclasses with `init()` / `start()` / `stop()` / `reInit()` hooks, coordinated by `ServiceManager`. Services are registered in `BackendApp` and started in order.

**HTTP layer** (`src/Server/HttpServer/`): Express 5 server wrapped with helmet, rate-limiting, session, CSRF, and cookie-parser. `AsyncLocalStorage` propagates request context without parameter passing. Swagger UI is auto-generated from VTS schemas. Variants: `USHttpServer` (Unix socket), `ViteHttpServer` (Vite integration).

**Database layer** (`src/Db/`):
- `MariaDB` — TypeORM entity/repository pattern with custom transformers and migration support
- `RedisDB` — cache + pub/sub channel subscriptions
- `InfluxDB` — time-series client
- `ChromaDB` — vector collection loader

**Plugin system** (`src/Plugins/`): Plugins extend `APlugin`. `PluginManager` discovers, loads, and validates plugins using Merkle-tree hash verification (`src/Crypto/`). The CLI's `-create-plugin-hash` flag generates plugin hashes.

**Schema validation**: The framework uses the external `vts` library for schema definition. Schemas serve dual purpose: runtime input validation on routes and Swagger/OpenAPI doc generation (`src/Utils/Swagger*.ts`).

**Shared state** (`src/SharedStore/`): `IPCSharedStore` for single-host clusters, `RedisSharedStore` for distributed clusters. Used by `BackendCluster` for cross-process coordination.

**ACL** (`src/ACL/`): `ACLRbac` (role-based) and `ACL` compose into route-level access control.

**Config** (`src/Config/`): `ConfigBackend` loads JSON config files and merges `.env` variables (dotenv). Validated against a VTS schema provided by the consumer.

### Key conventions

- All service classes use TypeScript generics extensively for config and schema types.
- Decorators are enabled (`experimentalDecorators: true`) — TypeORM entities use class-decorator syntax.
- Public API surface is exported from `src/index.ts`.
- The `Example/` directory shows a complete working backend wiring all subsystems together.