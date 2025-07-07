import { ConfigBackend } from '../../Config/ConfigBackend.js';
import { ConfigBackendOptions } from '../../Schemas/Config/ConfigBackendOptions.js';
export declare class ExampleConfig extends ConfigBackend {
    static getInstance(): ExampleConfig;
    protected _loadEnv(aConfig: ConfigBackendOptions | null): ConfigBackendOptions | null;
}
