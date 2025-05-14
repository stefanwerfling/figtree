import { ExampleBackend } from './Application/ExampleBackend.js';
(async () => {
    console.log("Figtree Example");
    const backend = new ExampleBackend();
    await backend.start();
})();
//# sourceMappingURL=main.js.map