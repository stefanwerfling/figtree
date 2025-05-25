import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * SchemaPluginDefinition
 */
export const SchemaPluginDefinition = Vts.object({
    name: Vts.string({description: 'Plugin name'}),
    description: Vts.string({description: 'Plugin description'}),
    version: Vts.string({description: 'Plugin version'}),
    author: Vts.string({description: 'Author from plugin'}),
    url: Vts.string({description: 'Page url from plugin'}),
    main: Vts.string({description: 'Main Class'}),
    main_directory: Vts.optional(Vts.array(Vts.string({description: 'You can set your plugin main directory, is optional'})))
}, {description: 'Plugin definition for package.json'});

/**
 * PluginDefinition
 */
export type PluginDefinition = ExtractSchemaResultType<typeof SchemaPluginDefinition>;