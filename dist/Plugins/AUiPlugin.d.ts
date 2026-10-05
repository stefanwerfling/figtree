import { PluginUiField } from 'figtree-schemas';
import { APlugin } from './APlugin.js';
export declare abstract class AUiPlugin extends APlugin {
    abstract getUiSchema(): PluginUiField[];
    getData(): Promise<Record<string, unknown>>;
    setData(_values: Record<string, unknown>): Promise<boolean>;
}
