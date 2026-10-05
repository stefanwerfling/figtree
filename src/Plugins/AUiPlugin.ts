import {PluginUiField} from 'figtree-schemas';
import {APlugin} from './APlugin.js';

/**
 * Abstract UI plugin class.
 *
 * Optional extension of {@link APlugin} for plugins that expose a config UI.
 * Only plugins that want a UI extend this; plain plugins keep extending
 * {@link APlugin} and carry no UI surface. A host can therefore detect a
 * configurable plugin with `instanceof AUiPlugin`.
 *
 * The UI is described declaratively (see {@link getUiSchema}) as pure data so
 * the host can serialize it to its frontend unchanged, and the same description
 * drives validation of the values written via {@link setData}.
 */
export abstract class AUiPlugin extends APlugin {

    /**
     * Declarative description of the plugin config UI: the list of fields the
     * host renders as a config form.
     * @returns {PluginUiField[]}
     */
    public abstract getUiSchema(): PluginUiField[];

    /**
     * Return the plugin's current config values, keyed by the field `key`s of
     * {@link getUiSchema}. The default is empty; a host base class (e.g.
     * flyingfish_core) typically overrides this with a persistent key/value
     * store so simple plugins get persistence for free.
     * @returns {Promise<Record<string, unknown>>}
     */
    public async getData(): Promise<Record<string, unknown>> {
        return {};
    }

    /**
     * Persist the plugin's config values. Implementations are expected to
     * validate against {@link getUiSchema} before writing. The default is a
     * no-op returning `false` (not persisted); overridden by the host base
     * class with the actual store.
     * @param {Record<string, unknown>} _values
     * @returns {Promise<boolean>} true when the values were accepted and stored.
     */
    public async setData(_values: Record<string, unknown>): Promise<boolean> {
        return false;
    }

}
