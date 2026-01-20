import { ConfigOptions, DefaultArgs } from 'figtree_schemas';
import { Schema } from 'vts';
import { BackendApp } from '../../Application/BackendApp.js';
import { ExampleConfig } from '../Config/ExampleConfig.js';
export declare class ExampleBackend extends BackendApp<DefaultArgs, ConfigOptions> {
    static NAME: string;
    constructor();
    protected _getConfigInstance(): ExampleConfig;
    protected _getArgSchema(): Schema<DefaultArgs> | null;
    protected _initServices(): Promise<void>;
}
