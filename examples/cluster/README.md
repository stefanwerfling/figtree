# Cluster example

A FigTree backend running in cluster mode with role-based service routing, the cluster registry, and a leader-elected cron worker.

## What it demonstrates

- `bootstrap()` — single entry point that decides cluster vs single-process from `config.json`.
- `setupClusterRegistryFromConfig()` — auto-wires the SharedStore + ClusterRegistry from the config.
- **Worker roles** — HTTP services run on `http` workers; the cron job runs only on the `cron` worker.
- **`ClusterLeader`** — gates the cron worker so even with multiple cron workers across hosts, only one is "active".
- **Cluster-wide service view** at `GET /v1/service/status/cluster`.

## Run

The example ships with `config.json` configured for IPC (single-host cluster). For multi-host, switch `cluster.sharedStore.type` to `"redis"` and ensure `db.redis` points to a shared Redis.

From the figtree root:

```bash
npm run build                                  # build the library
npx tsx examples/cluster/main.ts \
    --config examples/cluster/config.json
```

Output:

```
Master 12345 is running
Worker 12346 (role=http) starting...
Worker 12347 (role=http) starting...
Worker 12348 (role=cron) starting...
this worker became cluster-wide cron leader
HelloCronJob fired in PID 12348
```

## Endpoints

- `http://localhost:3000/swagger` — Swagger UI
- `GET /json/v1/service/status` — services on the worker that handled this request
- `GET /json/v1/service/status/cluster` — services across **all** workers, aggregated via the ClusterRegistry

## Switching to single-process

Set `cluster.enabled: false` (or remove the `cluster` block entirely). `bootstrap()` will then run the same `ExampleBackend` in a single process. The role filters become inactive in single-process mode, so all services run.

## Multi-host

To run across hosts:

1. Run a shared Redis instance reachable from every host.
2. Set `cluster.sharedStore.type: "redis"` and adjust `db.redis.url` on every host.
3. Start the example on each host — they will appear together in `GET /v1/service/status/cluster` and exactly one cron worker (across all hosts) will hold the lease.

## Structure

```
cluster/
├── main.ts                            # bootstrap entry point
├── config.json                        # cluster section + sharedStore
├── tsconfig.json
└── src/
    ├── Application/ExampleBackend.ts  # role-filtered service registration
    ├── Services/HelloCronJob.ts       # cron-only service
    ├── Config/ExampleConfig.ts
    ├── ACL/MyACLRbac.ts
    ├── Routes/
    │   ├── ExampleRouteLoader.ts
    │   └── API/Login.ts
    └── Schemas/Routes/Login/Login.ts
```

## Where to look next

- For the basics without cluster, see [`../single-process`](../single-process).
- For the full architecture overview, see [`doc/cluster.md`](../../doc/cluster.md).