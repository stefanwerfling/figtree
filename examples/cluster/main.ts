import {bootstrap} from 'figtree';
import {ExampleBackend} from './src/Application/ExampleBackend.js';

/**
 * Cluster FigTree example.
 *
 * Run from the figtree root (after `npm run build`):
 *   npx tsx examples/cluster/main.ts \
 *       --config examples/cluster/config.json
 *
 * `bootstrap()` reads `cluster.enabled` from the config file:
 * - true  → forks workers (BackendCluster)
 * - false → runs single-process
 *
 * The same `main.ts` works for both modes — only the config differs.
 */
(async(): Promise<void> => {
    console.log('FigTree cluster example');

    const backend = await bootstrap(() => new ExampleBackend());
    await backend.start();
})();