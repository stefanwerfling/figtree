import {BackendCluster} from '../Application/BackendCluster.js';
import {ExampleBackend} from './Application/ExampleBackend.js';

/**
 * Main
 */
(async(): Promise<void> => {
    console.log("Figtree Example");

    /**
     * Use cluster only when you controll all single instance and manage over a sharing (redis, memory sharing ...)
     */
    const useCluster = false;

    /**
     * Backend
     */
    let backend: ExampleBackend|BackendCluster = new ExampleBackend();

    if (useCluster) {
        backend = new BackendCluster({
            appFactory: () => new ExampleBackend()
        });
    }

    await backend.start();
})();