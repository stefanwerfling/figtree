# Single-process example

A minimal FigTree backend running in a single Node.js process: HTTP server, login route, plugin manager, Swagger UI, ACL.

## Run

From the figtree root:

```bash
npm run build                                  # build the library
npx tsx examples/single-process/main.ts \
    --config=examples/single-process/config.json
```

Then open:

- `http://localhost:3000/swagger` — Swagger UI
- `POST http://localhost:3000/json/v1/login/login/` with `{"username": "test", "password": "1234"}` — demo login

## Structure

```
single-process/
├── main.ts                         # entry point — instantiates ExampleBackend
├── config.json                     # config (no cluster section)
├── tsconfig.json
└── src/
    ├── Application/
    │   └── ExampleBackend.ts       # extends BackendApp; registers services
    ├── Config/ExampleConfig.ts     # ConfigBackend subclass
    ├── ACL/MyACLRbac.ts            # roles + rights
    ├── Routes/
    │   ├── ExampleRouteLoader.ts   # HttpRouteLoader implementation
    │   └── API/Login.ts            # /v1/login routes
    └── Schemas/Routes/Login/Login.ts
```

## Where to look next

- For multi-process / multi-host, see [`../cluster`](../cluster).
- For a deeper overview, see the main [README](../../README.md) and [`doc/cluster.md`](../../doc/cluster.md).