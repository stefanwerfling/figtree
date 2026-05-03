import {ExampleBackend} from './src/Application/ExampleBackend.js';

/**
 * Single-process FigTree example.
 *
 * Run from the figtree root (after `npm run build`):
 *   npx tsx examples/single-process/main.ts
 *
 * The backend reads `examples/single-process/config.json` from the current
 * working directory by default. Pass `--config <path>` to override.
 */
(async(): Promise<void> => {
    console.log('FigTree single-process example');
    await new ExampleBackend().start();
})();