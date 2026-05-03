import {ExampleBackend} from './src/Application/ExampleBackend.js';

/**
 * Plugin-host FigTree example.
 *
 * Loads plugins from `host/node_modules/<service>/...` after they have been
 * installed via the local `file:` dependency on `../my-plugin`.
 *
 * Run from the figtree root (after `npm run build`):
 *   cd examples/plugin/host && npm install
 *   npx tsx examples/plugin/host/main.ts \
 *       --config=examples/plugin/host/config.json
 */
(async(): Promise<void> => {
    console.log('FigTree plugin-host example');
    await new ExampleBackend().start();
})();