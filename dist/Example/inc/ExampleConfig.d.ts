import { Config } from '../../Config/Config.js';
import { ConfigBackend } from '../../Config/ConfigBackend.js';
import { ConfigBackendOptions } from '../../Schemas/Config/ConfigBackendOptions.js';
import { ConfigOptions } from '../../Schemas/Config/ConfigOptions.js';
export declare class ExampleConfig extends ConfigBackend {
    static getInstance<I extends ConfigOptions>(): Config<I>;
    protected _loadEnv(aConfig: ConfigBackendOptions | null): ConfigBackendOptions | null;
}
