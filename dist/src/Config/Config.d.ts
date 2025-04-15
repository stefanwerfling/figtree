import { ObjectSchema } from 'vts/dist/schemas/objectSchema.js';
import { ConfigOptions } from '../Schemas/Config/ConfigOptions.js';
export declare class Config<T extends ConfigOptions = ConfigOptions> {
    static readonly DEFAULT_CONFIG_FILE = "config.json";
    static readonly DEFAULT_DIR: string;
    protected static _instance: Config<any>;
    static getInstance<I extends ConfigOptions>(): Config<I>;
    protected _schema: ObjectSchema<any> | null;
    private _appName;
    protected _config: T | null;
    protected constructor(schema: ObjectSchema<any>);
    setAppName(name: string): void;
    getAppName(): string | null;
    set(aConfig: T | null): void;
    get(): T | null;
    load(configFile?: string | null, useEnv?: boolean): Promise<T | null>;
    protected _loadEnv(config: T | null): T | null;
    protected _setDefaults(config: T | null): T | null;
}
