import { Schema } from 'vts';
import { BackendApp } from '../../Application/BackendApp.js';
import { DefaultArgs } from '../../Schemas/Args/DefaultArgs.js';
import { ConfigOptions } from '../../Schemas/Config/ConfigOptions.js';
import { ExampleConfig } from '../Config/ExampleConfig.js';
export declare class ExampleBackend extends BackendApp<DefaultArgs, ConfigOptions> {
    static NAME: string;
    constructor();
    protected _getConfigInstance(): ExampleConfig;
    protected _getArgSchema(): Schema<DefaultArgs> | null;
    protected _initServices(): Promise<void>;
}
