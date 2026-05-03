# Plugin example

A FigTree backend plus a sample plugin that demonstrates **all three plugin extension points** added in this iteration:

| Hook | What the plugin does |
|---|---|
| **`AProviderOnLoadEvent` → `IHttpRouteProvider`** | Adds `GET /json/v1/plugin/hello` to the host's HTTP server. |
| **`AProviderOnLoadEvent` → `IHttpMiddlewareProvider`** | Installs a global `X-Request-Id` middleware that sets a header on every response. |
| **`OnBackendLifecycleEvent`** | Logs a message when the backend finishes startup and again when it begins shutdown. |

## Layout

```
plugin/
├── README.md                      # this file
├── host/                          # the figtree backend that loads plugins
│   ├── main.ts
│   ├── config.json
│   ├── package.json               # local file: dep on ../my-plugin
│   ├── tsconfig.json
│   └── src/
│       ├── Application/ExampleBackend.ts
│       ├── Routes/, ACL/, Config/, Schemas/
└── my-plugin/                     # the plugin
    ├── package.json               # contains the `figtree` block
    ├── tsconfig.json
    └── src/
        ├── index.ts               # default export = MyPlugin (extends APlugin)
        ├── MyHttpRouteProvider.ts
        ├── MyHttpMiddlewareProvider.ts
        ├── MyLifecycleEvent.ts
        ├── HelloRoute.ts
        └── HelloRouteLoader.ts
```

## Run

```bash
# from the figtree root
npm run build                        # build the library

# install the plugin into the host's node_modules (file: dependency)
( cd examples/plugin/host && npm install --no-package-lock )

# run
npx tsx examples/plugin/host/main.ts \
    --config=examples/plugin/host/config.json
```

You should see (among the log lines):

```
PluginManager::load: Plugin is loaded my-plugin
[my-plugin] backend is up — plugin lifecycle onStart fired
```

## Try it

```bash
curl -i http://localhost:3000/json/v1/plugin/hello
```

The response:

- Comes from the route contributed by the plugin (`HelloRoute`).
- Carries an `X-Request-Id` header set by the plugin's middleware.
- The body includes `"plugin": "my-plugin"` and the host's `pid`.

On Ctrl-C you'll see:

```
[my-plugin] backend is shutting down — plugin lifecycle onStop fired
```

## How `PluginManager` finds the plugin

1. `PluginService` (registered in `ExampleBackend._initServices`) starts a `PluginManager` configured with the host's service name (`example_plugin_host`) as the search namespace.
2. `PluginManager.scan()` walks `host/node_modules`, reads each `package.json`, and looks for the configured key — `figtree` by default.
3. Every package whose `package.json[figtree]` is a valid `PluginDefinition` is loaded — its `main` file is `import()`ed, and the default export is instantiated as an `APlugin`.

To target the host with a more specific key, pass it to `PluginManager`:

```typescript
new PluginService(ExampleBackend.NAME, { pluginKey: 'example_plugin_host' });
```

Plugins then put their definition under that key instead of `figtree`. Useful when shipping plugins that should only load for a specific host.

## How the plugin contributes routes / middleware

`HttpRouteProviders` and `HttpMiddlewareProviders` (from figtree) implement the lookup pattern:

1. They iterate every `APluginEvent` registered with the `PluginManager`.
2. They keep only the ones that extend `AProviderOnLoadEvent<E, T>` for their concrete `T`.
3. They call `getProviders()` on each, collect the providers, and use them.

The plugin's job is to emit such an event from its `onEnable()`:

```typescript
public async onEnable(): Promise<boolean> {
    const manager = this.getPluginManager();
    manager.registerEvents(new MyHttpRouteProvider(),      this);
    manager.registerEvents(new MyHttpMiddlewareProvider(), this);
    manager.registerEvents(new MyLifecycleEvent(),          this);
    return true;
}
```

That's all — the host doesn't need to know about the plugin.