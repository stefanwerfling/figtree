import { BackendCluster } from '../Application/BackendCluster.js';
import { ExampleBackend } from './Application/ExampleBackend.js';
(async () => {
    console.log("Figtree Example");
    const useCluster = false;
    let backend;
    if (useCluster) {
        backend = new BackendCluster({
            appFactory: () => new ExampleBackend()
        });
    }
    else {
        backend = new ExampleBackend();
    }
    await backend.start();
})();
//# sourceMappingURL=main.js.map