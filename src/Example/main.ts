import {BackendCluster} from '../Application/BackendCluster.js';
import {ExampleBackend} from './Application/ExampleBackend.js';

/**
 * Main
 */
(async(): Promise<void> => {
    console.log("Figtree Example");

    const useCluster = false;
    let backend: ExampleBackend|BackendCluster = new ExampleBackend();

    if (useCluster) {
        backend = new BackendCluster({
            appFactory: () => new ExampleBackend()
        });
    }

    await backend.start();
})();