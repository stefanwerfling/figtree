[![Discord](https://img.shields.io/discord/1347133593578766369.svg?label=Discord&logo=discord&color=5865F2&logoColor=white)](https://discord.gg/52PQ2mbWQD) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/stefanwerfling/figtree)

# FigTree - Server Core/Backend Framework

<p align="center">
<img src="/doc/images/logo.png" width="300px" style="border-radius: 15px;transition: transform .2s;object-fit: cover;">
<br><br>
FigTree is a Node.js backend framework for rapid development of server applications. It provides an integrated foundation with HTTP server, database support, plugin architecture, schema validation, and service lifecycle management.
</p>

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Services](#services)
- [HTTP Server & Routes](#http-server--routes)
- [Database](#database)
- [Plugin System](#plugin-system)
- [Cluster Support](#cluster-support)
- [CLI Tool](#cli-tool)
- [Features](#features)
- [Used By](#used-by)

---

## Installation

```bash
npm install git+https://github.com/stefanwerfling/figtree.git
```

Install peer dependencies for the features you use:

```bash
# Core (always required)
npm install express express-rate-limit express-session helmet cookie-parser csurf async-exit-hook winston winston-daily-rotate-file uuid ets vts

# MariaDB
npm install typeorm mysql2

# Redis
npm install redis

# InfluxDB
npm install @influxdata/influxdb-client

# ChromaDB
npm install chromadb

# Vite integration
npm install vite

# Plugins / Crypto
npm install node-forge node-schedule rbac-simple
```

**TypeScript types:**

```bash
npm install --save-dev \
  @types/express \
  @types/express-session \
  @types/async-exit-hook \
  @types/cookie-parser \
  @types/node \
  @types/uuid \
  git+https://github.com/stefanwerfling/node-forge-types.git
```

---

## Quick Start

### 1. Define your config schema and type

```typescript
import { ConfigBackend, ConfigBackendOptions } from 'figtree';
import { SchemaConfigBackendOptions } from 'figtree-schemas';

// Use the built-in ConfigBackendOptions or extend it
type MyConfig = ConfigBackendOptions;
```

### 2. Define CLI arguments

```typescript
import { DefaultArgs } from 'figtree-schemas';

type MyArgs = DefaultArgs;
```

### 3. Create your backend

```typescript
import { BackendApp } from 'figtree';
import { HttpService } from 'figtree';

export class MyBackend extends BackendApp<MyArgs, MyConfig> {

    protected override _getConfigInstance() {
        return new ConfigBackend<MyConfig>(SchemaConfigBackendOptions);
    }

    protected override async _initServices(): Promise<void> {
        this._serviceManager.add(new HttpService());
    }
}
```

### 4. Start

```typescript
const backend = new MyBackend();
await backend.start();
```

### 5. Config file (`config.json`)

```json
{
    "server": {
        "port": 3000
    },
    "logging": {
        "dirname": "./logs"
    }
}
```

A full working example is available in [`src/Example/`](src/Example/).

---

## Configuration

FigTree loads configuration from a JSON file (default: `config.json`) and validates it against a VTS schema. The config path is read from the `--config` CLI argument or falls back to `config.json` in the working directory.

```typescript
const backend = new MyBackend();
await backend.start();
```

**Environment variables** can be loaded from a `.env` file by passing `--envargs 1` on the command line. `ConfigBackend` maps env variables to config fields — override `_loadEnv()` to implement your own mapping.

---

## Services

Services are the building blocks of a FigTree application. Each service has a lifecycle: `init → start → stop`.

### Built-in services

| Service | Description |
|---|---|
| `HttpService` | Starts the HTTP/HTTPS server |
| `MariaDBService` | Connects to MariaDB via TypeORM |
| `RedisDBService` | Connects to Redis |
| `InfluxDBService` | Connects to InfluxDB |
| `ChromaDBService` | Connects to ChromaDB |
| `PluginService` | Loads and manages plugins |

### Registering services

```typescript
protected override async _initServices(): Promise<void> {
    this._serviceManager.add(new MariaDBService());
    this._serviceManager.add(new HttpService(['mariadb'])); // depends on mariadb
}
```

Services with dependencies are started in the correct order automatically.

### Custom service

```typescript
import { ServiceAbstract, ServiceStatus } from 'figtree';

export class MyService extends ServiceAbstract {
    public static NAME = 'myservice';

    public constructor() {
        super(MyService.NAME);
    }

    public override async start(): Promise<void> {
        this._status = ServiceStatus.Progress;
        // your init logic
        this._status = ServiceStatus.Success;
    }

    public override async stop(): Promise<void> {
        // your cleanup logic
        this._status = ServiceStatus.None;
    }
}
```

### Scheduled jobs

```typescript
import { ServiceJobAbstract } from 'figtree';

export class MyJob extends ServiceJobAbstract {
    public static NAME = 'myjob';

    public constructor() {
        super(MyJob.NAME, '*/5 * * * *'); // every 5 minutes (cron syntax)
    }

    protected override async _execute(): Promise<void> {
        // runs on schedule
    }
}
```

---

## HTTP Server & Routes

### Defining a route

```typescript
import { DefaultRoute } from 'figtree';
import { Router } from 'express';

export class MyRoute extends DefaultRoute {

    public getExpressRouter(): Router {
        this._get(
            this._getUrl('v1', 'example', 'hello'),
            false, // no login required
            async (_req, _res, _data) => {
                return { statusCode: 200, msg: 'Hello World' };
            },
            {
                description: 'Hello World endpoint',
                responseBodySchema: SchemaMyResponse
            }
        );

        return super.getExpressRouter();
    }
}
```

### Route options

| Field | Description |
|---|---|
| `bodySchema` | Validate request body |
| `querySchema` | Validate query parameters |
| `pathSchema` | Validate path parameters |
| `headerSchema` | Validate request headers |
| `cookieSchema` | Validate cookies |
| `sessionSchema` | Validate and initialize session |
| `responseBodySchema` | Validate response body (also generates Swagger docs) |
| `parser` | Middleware(s) — `RequestHandler \| RequestHandler[]` |
| `aclRight` | Required ACL right for this route |
| `useLocalStorage` | Enable `AsyncLocalStorage` request context |

### Protecting against brute force

```typescript
import { createBruteForceProtection } from 'figtree';

this._post(
    this._getUrl('v1', 'auth', 'login'),
    false,
    loginHandler,
    {
        parser: createBruteForceProtection({ limit: 10, windowMs: 15 * 60 * 1000 }),
        bodySchema: SchemaLoginRequest,
        responseBodySchema: SchemaDefaultReturn,
        sessionSchema: SchemaSessionData
    }
);
```

### Global route middleware

```typescript
export class MyRoute extends DefaultRoute {
    public constructor() {
        super();
        this._defaultParser = createBruteForceProtection({ limit: 20 });
    }
}
```

### Registering routes

Subclass `HttpRouteLoader` and override `loadRoutes()`, then pass the class to `HttpService`:

```typescript
import { HttpRouteLoader, IDefaultRoute } from 'figtree';

export class MyRouteLoader extends HttpRouteLoader {
    public static override async loadRoutes(): Promise<IDefaultRoute[]> {
        return [new MyRoute()];
    }
}
```

### Swagger UI

Swagger UI is automatically generated from your route schemas. It is available at `/swagger` when `SwaggerUIRoute` is registered.

### Customizing the CSP policy

Override `_getCspDirectives()` in your `HttpServer` subclass:

```typescript
import { HttpServer } from 'figtree';

export class MyHttpServer extends HttpServer {
    protected override _getCspDirectives(): Record<string, string[]> {
        return {
            ...super._getCspDirectives(),
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.example.com']
        };
    }
}
```

### Persistent session store

Override `_getSessionStore()` in your `HttpServer` subclass to replace the default in-memory store:

```typescript
protected override _getSessionStore(): Store {
    const RedisStore = RedisStoreFactory(session);
    return new RedisStore({ client: RedisClient.getInstance().getClient() });
}
```

### Reverse proxy

FigTree is designed to run behind a reverse proxy in production. For local development, a temporary self-signed certificate is generated automatically when no cert/key is configured. Use [FlyingFish](https://github.com/stefanwerfling/flyingfish), Nginx, or similar in production.

---

## Database

### MariaDB

Extend `DBRepository` or `DBRepositoryUnid` for your entities:

```typescript
import { DBRepository, DBBaseEntityId } from 'figtree';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEntity extends DBBaseEntityId {
    @Column()
    public name!: string;
}

export class UserRepository extends DBRepository<UserEntity> {
    public constructor() {
        super(UserEntity);
    }
}
```

**Available transformers** for TypeORM columns: `BoolTransformer`, `IntTransformer`, `DecimalTransformer`, `EncryptionTransformer`, `ZeroPaddingTransformer`.

### Redis

```typescript
import { RedisClient } from 'figtree';

const client = RedisClient.getInstance();
await client.set('key', { foo: 'bar' });
const value = await client.get<{ foo: string }>('key');
```

### InfluxDB

```typescript
import { InfluxDbHelper } from 'figtree';

const point = new Point('temperature').floatField('value', 23.5);
InfluxDbHelper.addPoint(point);
```

---

## Plugin System

### Creating a plugin

```typescript
import { APlugin } from 'figtree';

export default class MyPlugin extends APlugin {
    public override async onEnable(): Promise<void> {
        // plugin loaded
    }
}
```

Each plugin requires a `plugin.json` definition file:

```json
{
    "name": "my-plugin",
    "version": "1.0.0",
    "main": "dist/index.js"
}
```

### Generating a plugin hash

Run in your plugin project directory after building:

```bash
npx figtree -create-plugin-hash
```

This generates a Merkle hash of all files in `dist/`. The hash is used by `PluginManager` to verify plugin integrity at load time.

---

## Cluster Support

FigTree supports multi-process clustering via `BackendCluster`. Workers share state via `IPCSharedStore` (single host) or `RedisSharedStore` (distributed).

```typescript
import { BackendCluster } from 'figtree';

const cluster = new BackendCluster({
    appFactory: () => new MyBackend(),
    workers: 4,                             // optional, defaults to os.cpus().length
    shutdownTimeoutMs: 15_000,              // optional, default 15s
    shutdownSignals: ['SIGTERM', 'SIGINT'], // optional
    respawn: {                              // optional
        backoffMs: [0, 1000, 5000, 15_000, 30_000],
        maxPerWindow: 5,
        windowMs: 60_000
    }
});
await cluster.start();
```

### Graceful shutdown

When the master receives a shutdown signal (`SIGTERM` / `SIGINT` by default):

1. Respawn is disabled — workers that exit during shutdown are not replaced.
2. Each worker receives `SIGTERM`, triggering `BackendApp`'s `async-exit-hook` which runs `ServiceManager.stopAll()` (HTTP draining, DB connections closed, etc.).
3. The master waits up to `shutdownTimeoutMs` for all workers to exit voluntarily.
4. Any worker still alive after the timeout is killed with `SIGKILL`.
5. The master exits with code `0`.

`shutdownTimeoutMs` should be larger than the worker-side timeout (10s in `BackendApp.start()`) so the worker has a chance to finish first.

### Crash backoff & circuit breaker

When a worker exits unexpectedly, respawn is delayed by a progressive backoff and bounded by a circuit breaker:

- The 1st crash respawns instantly, the 2nd after `1s`, the 3rd after `5s`, etc. (configurable via `respawn.backoffMs`).
- Crashes are tracked across a rolling window (`respawn.windowMs`, default `60s`).
- If more than `respawn.maxPerWindow` (default `5`) crashes occur within that window, the master halts the cluster with `process.exit(1)` so a process supervisor (systemd, Kubernetes, etc.) can restart it.

For more details see [`doc/cluster.md`](doc/cluster.md).

---

## Features

- [x] Schema declaration & validation (VTS)
- [x] Environment variable loading (dotenv)
- [x] JSON config loading with schema validation
- [x] Logging (Winston with daily rotation)
- [x] MariaDB (TypeORM), Redis, InfluxDB, ChromaDB
- [x] HTTP/HTTPS server (Express, rate limiting, helmet, session, CSRF)
  - [x] Swagger UI with auto-generated docs from schemas
  - [x] Unix socket HTTP server
  - [x] File upload helper
  - [x] AsyncLocalStorage request context
  - [x] Vite integration for frontend dev
  - [ ] WebSocket server
- [x] Service manager with dependency resolution and scheduling
- [x] Provider system
- [x] Plugin manager with Merkle-hash validation
  - [ ] Plugin signing (CA)
- [x] Crypto: PEM helper, certificate generator
- [x] ACL / RBAC
- [x] Cluster support with shared state (IPC / Redis)
  - [ ] DB history (change tracking)

---

## Used By

* **[PuppeteerCast](https://github.com/stefanwerfling/puppeteercast)** — Converts web browser content into live video streams via HTTP endpoints.

* **[FlyingFish](https://github.com/stefanwerfling/flyingfish)** *(coming soon)* — Reverse proxy manager with WebUI, DNS server, SSH server, DynDNS, UPNP, Let's Encrypt and more.

* **[MWPA](https://github.com/M-E-E-R-e-V/mwpa)** *(coming soon)* — Scientific observational data acquisition for marine mammal research.

---

## UI Framework

To build a frontend for your FigTree API, the companion framework [Bambooo](https://github.com/stefanwerfling/bambooo) can be used.