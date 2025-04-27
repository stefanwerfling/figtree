import {ExampleBackend} from './inc/ExampleBackend.js';

/**
 * Main
 */
(async(): Promise<void> => {
    console.log("Figtree Example");

    const backend = new ExampleBackend();
    await backend.start();
})();