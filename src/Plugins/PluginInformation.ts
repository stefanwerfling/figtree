import {PluginDefinition} from '../Schemas/Plugin/PluginDefinition.js';

/**
 * PluginInformation
 */
export type PluginInformation = {
    definition: PluginDefinition;
    path: string;
};