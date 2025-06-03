import { Schema } from 'vts';
import { BackendApp } from '../../Application/BackendApp.js';
import { Config } from '../../Config/Config.js';
import { DefaultArgs } from '../../Schemas/Args/DefaultArgs.js';
import { ConfigOptions } from '../../Schemas/Config/ConfigOptions.js';
export declare class ExampleBackend extends BackendApp<DefaultArgs, ConfigOptions> {
    static NAME: string;
    constructor();
    protected _getConfigInstance(): Config<ConfigOptions>;
    protected _getArgSchema(): Schema<DefaultArgs> | null;
    protected _initServices(): Promise<void>;
}
