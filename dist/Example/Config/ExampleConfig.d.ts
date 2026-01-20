import { ConfigBackendOptions } from 'figtree_schemas';
import { ConfigBackend } from '../../Config/ConfigBackend.js';
export declare class ExampleConfig extends ConfigBackend {
    static getInstance(): ExampleConfig;
    protected _loadEnv(aConfig: ConfigBackendOptions | null): ConfigBackendOptions | null;
}
