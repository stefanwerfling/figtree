# FigTree examples

Two complete, self-contained backends:

| Example | What it shows |
|---|---|
| [`single-process`](./single-process) | Plain FigTree backend in one Node.js process — HTTP, login, plugins, Swagger UI. Start here. |
| [`cluster`](./cluster) | Multi-process cluster with worker roles, the `ClusterRegistry`, and a leader-elected cron worker. |

## Running

Each example has its own `config.json`, `tsconfig.json`, and `README.md`. From the figtree root:

```bash
npm run build                                  # build the library

# single-process
npx tsx examples/single-process/main.ts \
    --config=examples/single-process/config.json

# cluster
npx tsx examples/cluster/main.ts \
    --config=examples/cluster/config.json
```

## Adapting to your own project

The example sources import from the package name `figtree`. When you copy an example into your own repository, install figtree as a dependency and the imports stay the same.

Examples are excluded from the published npm package (see `files` in the root `package.json`) — they only live in this repository for documentation and as templates.