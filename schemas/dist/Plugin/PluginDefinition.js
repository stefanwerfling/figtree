import { Vts } from 'vts';
export const SchemaPluginDefinition = Vts.object({
    name: Vts.string({ description: 'Plugin name' }),
    description: Vts.string({ description: 'Plugin description' }),
    version: Vts.string({ description: 'Plugin version' }),
    author: Vts.string({ description: 'Author from plugin' }),
    url: Vts.string({ description: 'Page url from plugin' }),
    main: Vts.string({ description: 'Main Class' }),
    main_directory: Vts.optional(Vts.array(Vts.string({ description: 'You can set your plugin main directory, is optional' }))),
    distHash: Vts.optional(Vts.string({ description: 'dist merkle hash for code protection by plugins' })),
}, {
    description: 'Plugin definition for package.json',
});
//# sourceMappingURL=PluginDefinition.js.map